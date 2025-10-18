import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import type { ArtifactPaths, IJobDBClient } from '../jobDbClient.js'
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const RUNTIME_C_PATH = 'runtime.c';
const RUNTIME_O_PATH = 'runtime.o';

interface WorkerData {
  worker: Worker;
  busy: boolean;
}

export interface WorkerPoolOptions {
  size?: number;
  jobPollIntervalMs?: number;
  jobTimeoutMs?: number;
}

export async function startWorkerPool(dbClient: IJobDBClient, opts: WorkerPoolOptions = {}) {
  const size = opts.size ?? 2;
  const pollIntervalMs = opts.jobPollIntervalMs ?? 1000;
  const jobTimeoutMs = opts.jobTimeoutMs ?? 30_000;

  const workers: Array<WorkerData> = [];

  // Resolve path to worker script relative to this file (works in ts-node and built dist)
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const workerScript = path.resolve(thisDir, 'worker.cjs');

  console.debug('[pool] Emitting caraml runtime');
  await execAsync(`caraml --emit-runtime ${RUNTIME_C_PATH}`)
  console.debug('[pool] Compiling caraml runtime with emscripten');
  await execAsync(`emcc -O2 ${RUNTIME_C_PATH} -c -o ${RUNTIME_O_PATH}`)
  console.debug('[pool] Runtime ready');

  function spawnWorker(index: number) {
    const w = new Worker(workerScript);
    const slot = workers[index];
    if (slot) {
      slot.worker = w;
      slot.busy = false;
    } else {
      workers[index] = { worker: w, busy: false };
    }
    w.on('exit', (code) => {
      console.warn(`[pool] worker ${index} exited with code ${code}`);
      // Mark not busy so loop can attempt reuse (will respawn)
      workers[index].busy = false;
      if (!stopped) {
        // Respawn a fresh worker instance
        spawnWorker(index);
      }
    });
    w.on('error', (err) => {
      console.error(`[pool] worker ${index} error:`, err);
    });
  }

  for (let i = 0; i < size; i++) {
    spawnWorker(i);
  }

  async function claimAndRun(workerIdx: number) {
    const slot = workers[workerIdx];
    if (!slot || slot.busy) return;
    try {
      const job = await dbClient.claimJob();
      if (!job) return;
      console.debug(`[pool] worker ${workerIdx} claimed job ${job.id}`);
      slot.busy = true;

      // send job to worker and wait for result with timeout
      const result = await new Promise<{ success: boolean; error?: string; id?: string; artifacts?: ArtifactPaths }>((resolve) => {
        let finished = false;
        const onMessage = (msg: any) => {
          if (finished) return;
          finished = true;
          cleanup();
          resolve(msg);
        };
        const onError = (err: Error) => {
          if (finished) return;
          finished = true;
          cleanup();
          resolve({ success: false, error: err.message });
        };
        // We expect normal completion via 'message'; exit before message is abnormal
        const onExit = (code: number) => {
          if (finished) return;
          finished = true;
          cleanup();
          resolve({ success: false, error: `worker exited prematurely with code ${code}` });
        };
        const timeout = setTimeout(() => {
          if (finished) return;
          finished = true;
          cleanup();
          try { slot.worker.terminate(); } catch (e) { }
          resolve({ success: false, error: 'job timeout' });
        }, jobTimeoutMs);

        function cleanup() {
          clearTimeout(timeout);
          slot.worker.off('message', onMessage);
          slot.worker.off('error', onError);
          slot.worker.off('exit', onExit);
        }

        slot.worker.on('message', onMessage);
        slot.worker.on('error', onError);
        slot.worker.on('exit', onExit);

        // send job payload
        slot.worker.postMessage(job);
      });

      if (result.success) {
        const { js, wasm, ir } = result.artifacts ?? { js: null, wasm: null, ir: null };
        await dbClient.updateJob(job.id, { id: job.id, status: 'succeeded', completedAt: new Date(), artifactIrPath: ir, artifactJsPath: js, artifactWasmPath: wasm });
        console.log('[pool] job succeeded', job.id, result.artifacts ? `artifacts=${JSON.stringify(result.artifacts)}` : '');
      } else {
        await dbClient.updateJob(job.id, { id: job.id, status: 'failed', completedAt: new Date(), errorMessage: result.error ?? 'unknown error' });
        console.error('[pool] job failed', job.id, result.error);
      }
    } catch (err: any) {
      console.error('[pool] claimAndRun error', err?.stack ?? err);
    } finally {
      const slot = workers[workerIdx];
      if (slot) slot.busy = false;
    }
  }

  // main loop: periodically try to fill idle workers
  let stopped = false;
  (async function loop() {
    while (!stopped) {
      for (let i = 0; i < workers.length; i++) {
        if (!workers[i].busy) {
          // Launch job attempt but don't await all sequentially
          claimAndRun(i).catch((e) => console.error(`[pool] claimAndRun exception w${i}`, e));
        }
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  })();

  return {
    stop: async () => {
      stopped = true;
      await Promise.all(workers.map(w => w.worker.terminate()));
    }
  };
}
