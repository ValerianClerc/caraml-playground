import { Hono } from 'hono';
import { z } from 'zod';
import { serve } from '@hono/node-server';
import type { AddressInfo } from 'net';
import { exec } from 'child_process';

const app = new Hono();

const compileSchema = z.object({
  mode: z.enum(['ir', 'binary', 'run']),
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
  const { mode, sourceCode } = parseResult.data;
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
