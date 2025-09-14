import { Hono } from 'hono';
import { z } from 'zod';
import { serve } from '@hono/node-server';
import type { AddressInfo } from 'net';
import { exec } from 'child_process';

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

const compileSchema = z.object({
  sourceCode: z.string(),
});

type CompileParams = z.infer<typeof compileSchema>;

app.post('/compile', async (c) => {
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
  return new Promise((resolve) => {
    exec('echo "Hello World"', (error, stdout, stderr) => {
      if (error) {
        resolve(c.json({ error: stderr }, 500));
      } else {
        resolve(c.json({ result: stdout }));
      }
    });
  });
});

app.all('*', (c) => c.json({ message: 'Not Found' }, 404));

// Set port and start server using Hono's Node adapter
// Set port via environment variable
process.env.PORT = '3000';
// Start server and log listening port
serve(app, (info: AddressInfo) => {
  console.log(`Server running on port ${info.port}`);
});
