import { Hono } from 'hono';
import { z } from 'zod';
import { serve } from '@hono/node-server';
import type { AddressInfo } from 'net';
import { exec } from 'child_process';
import { createJobDBClient } from './jobDbClient.js';


console.log('Starting server...');
const app = new Hono();

// Simple CORS middleware: allow an origin from env or default to Vite dev server
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173';
const allowedOrigin = process.env.CORS_ORIGIN || DEFAULT_CLIENT_ORIGIN;

app.use('*', async (c, next) => {
  const origin = c.req.header('origin') || '';
  // If the request has an Origin header and it matches allowedOrigin, echo it back.
  if (origin && (origin === allowedOrigin || allowedOrigin === '*')) {
    c.header('Access-Control-Allow-Origin', origin === '' ? allowedOrigin : origin);
  } else if (!origin && allowedOrigin === '*') {
    c.header('Access-Control-Allow-Origin', '*');
  }

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Apply headers to the context for normal responses
  Object.entries(corsHeaders).forEach(([k, v]) => c.header(k, v));

  // Handle preflight: return native Response to avoid Hono overload typing issues
  if (c.req.method === 'OPTIONS') {
    const preflightHeaders: Record<string, string> = {};
    // include the Access-Control-Allow-Origin from previously set header if present
    const acaOrigin = c.res.headers.get('Access-Control-Allow-Origin') || allowedOrigin;
    preflightHeaders['Access-Control-Allow-Origin'] = acaOrigin;
    Object.assign(preflightHeaders, corsHeaders);
    return new Response(null, { status: 204, headers: preflightHeaders });
  }

  await next();
});

const jobDbClient = createJobDBClient();
await jobDbClient.init();
console.log('Job DB initialized')

// start local worker pool (MVP)
import { startWorkerPool } from './worker/workerPool.js';
import { artifactStorage } from './artifactStorage.js';
const pool = await startWorkerPool(jobDbClient, { size: 2, jobPollIntervalMs: 800, jobTimeoutMs: 30_000 });

app.get('/health', (c) => {
  console.debug('/health pinged');
  return c.json({ status: 'ok' });
});

const compileSchema = z.object({
  sourceCode: z.string(),
});

type CompileParams = z.infer<typeof compileSchema>;

app.post('/queue-compilation', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON' }, 400);
  }
  const parseResult = compileSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.issues }, 400);
  }
  const { sourceCode } = parseResult.data;
  const jobInfo = await jobDbClient.createJob(sourceCode);
  return c.json(jobInfo);
});

app.get('/job-status/:jobId', async (c) => {
  const { jobId } = c.req.param();
  if (!jobId) {
    return c.json({ error: 'Missing jobId parameter' }, 400);
  }
  try {
    const jobStatus = await jobDbClient.getJobStatus(jobId);
    return c.json(jobStatus);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/artifacts/:jobId/:ext', async (c) => {
  const { jobId, ext } = c.req.param()
  if (!jobId || !ext) {
    return c.json({ error: 'Missing jobId or ext parameter' }, 400);
  }
  try {
    const artifacts = await jobDbClient.getJobArtifacts(jobId);
    if (ext !== 'js' && ext !== 'wasm' && ext !== 'ir') {
      return c.json({ error: 'Invalid artifact extension' }, 400);
    }
    const artifactPath = ext === 'js' ? artifacts.js : ext === 'wasm' ? artifacts.wasm : artifacts.ir;
    if (!artifactPath) {
      return c.json({ error: 'Artifact not found in database' }, 404);
    }
    const artifactStream = await artifactStorage.getArtifactStream(artifactPath);
    if (!artifactStream) {
      return c.json({ error: 'Artifact not found in blob storage' }, 404);
    }
    const body = new ReadableStream({
      start(controller) {
        artifactStream.on('data', (chunk) => controller.enqueue(chunk));
        artifactStream.on('end', () => controller.close());
        artifactStream.on('error', (err) => controller.error(err));
      }
    });

    const mimeType = ext === 'js' ? 'application/javascript' : ext === 'wasm' ? 'application/wasm' : 'text/plain';

    return c.body(body, 200, { 'Content-Type': mimeType });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.all('*', (c) => c.json({ message: 'Not Found' }, 404));

serve(app, (info: AddressInfo) => {
  console.log(`Server running on port ${info.port}`);
});