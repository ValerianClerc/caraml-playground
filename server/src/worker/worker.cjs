const { parentPort } = require('worker_threads');
const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Helper: spawn with streaming logs + timeout; returns promise { code, signal }
function runCommandStreaming(cmd, args, opts = {}) {
  const { timeoutMs = 120000, logPrefix = '', env } = opts; // default 2 min
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    const t = setTimeout(() => {
      stderr += `\n[timeout] Exceeded ${timeoutMs}ms`; // annotate
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', d => {
      const text = d.toString(); stdout += text; if (text.trim()) console.debug(`${logPrefix} ${text.trim()}`);
    });
    child.stderr.on('data', d => {
      const text = d.toString(); stderr += text; if (text.trim()) console.debug(`${logPrefix} [stderr] ${text.trim()}`);
    });
    child.on('error', err => { clearTimeout(t); reject(err); });
    child.on('close', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal, stdout, stderr, elapsedMs: Date.now() - start });
    });
  });
}

const RUNTIME_O_PATH = 'runtime.o';

// inline worker JS: receives a job { id, sourceCode } and runs a compilation & upload task.
parentPort.on('message', async (job) => {
  if (!job || !job.id) {
    parentPort.postMessage({ success: false, error: 'Invalid job payload' });
    return;
  }

  const llvmFileName = `${job.id}.ll`;
  const jsFileName = `${job.id}.js`;
  const wasmFileName = `${job.id}.wasm`;
  const sourceFilePath = `/tmp/${job.id}.cml`;
  const llvmFilePath = `/tmp/${llvmFileName}`;
  const jsFilePath = `/tmp/${jsFileName}`;
  const wasmFilePath = `/tmp/${wasmFileName}`;

  let success = false;
  let error = null;
  try {
    const fs = require('fs');
    console.debug(`[worker ${job.id}] Writing source file...`);
    fs.writeFileSync(sourceFilePath, job.sourceCode ?? '', 'utf8');

    console.debug(`[worker ${job.id}] Compiling to LLVM IR...`);
    await execAsync(`caraml --llvm ${sourceFilePath}`); // assuming this generates /tmp/<id>.ll

    // Preflight checks
    const fsStat = require('fs');
    if (!fsStat.existsSync(llvmFilePath)) {
      throw new Error(`LLVM file missing: ${llvmFilePath}`);
    }
    const llvmSize = fsStat.statSync(llvmFilePath).size;
    console.debug(`[worker ${job.id}] LLVM file ready (${llvmSize} bytes).`);
    const whichEmcc = await execAsync('which emcc || command -v emcc || echo "(emcc not found)"');
    console.debug(`[worker ${job.id}] emcc path: ${whichEmcc.stdout.trim()}`);
    const emVersion = await execAsync('emcc --version 2>&1 | head -n1 || true');
    console.debug(`[worker ${job.id}] emcc version: ${emVersion.stdout.trim()}`);

    console.debug(`[worker ${job.id}] Generating WebAssembly (invoking emcc)...`);
    const emArgs = [
      llvmFilePath,
      '-O3',
      '-s', 'WASM=1',
      '-s', 'MODULARIZE=1',
      '-s', 'EXPORT_NAME=createExec',
      '-s', 'INVOKE_RUN=0',
      '-s', 'EXIT_RUNTIME=1',
      '-s', 'ALLOW_MEMORY_GROWTH=1',
      '-s', 'EXPORTED_RUNTIME_METHODS=["callMain"]',
      RUNTIME_O_PATH,
      '-o', jsFilePath
    ];
    const emRes = await runCommandStreaming('emcc', emArgs, { timeoutMs: 30 * 1000, logPrefix: `[worker ${job.id}] emcc` });
    if (emRes.code !== 0) {
      throw new Error(`emcc failed (code=${emRes.code}, signal=${emRes.signal}) stderr=${emRes.stderr.slice(0, 4000)}`);
    }
    console.debug(`[worker ${job.id}] emcc done in ${emRes.elapsedMs}ms (stdout len=${emRes.stdout.length}).`);
    // Confirm wasm/js produce expected files
    if (!fsStat.existsSync(wasmFilePath)) {
      console.debug(`[worker ${job.id}] WARNING: wasm output missing at ${wasmFilePath}`);
    }

    console.debug(`[worker ${job.id}] Uploading artifacts...`);
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://caramlblob.blob.core.windows.net`,
      credential
    );
    const containerClient = blobServiceClient.getContainerClient('artifacts');
    const wasmBlockBlobClient = containerClient.getBlockBlobClient(wasmFileName);
    console.debug(`[worker ${job.id}] Uploading ${wasmFileName}...`);
    await wasmBlockBlobClient.uploadFile(wasmFilePath, {
      blobHTTPHeaders: { blobContentType: 'application/wasm' },
    });
    const jsBlockBlobClient = containerClient.getBlockBlobClient(jsFileName);
    console.debug(`[worker ${job.id}] Uploading ${jsFileName}...`);
    await jsBlockBlobClient.uploadFile(jsFilePath, {
      blobHTTPHeaders: { blobContentType: 'application/javascript' },
    });
    console.log(`[worker ${job.id}] Uploaded artifacts`);
    success = true;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error(`[worker ${job.id}] error: ${error}`);
  } finally {
    try {
      await execAsync(`rm -f ${llvmFilePath} ${jsFilePath} ${wasmFilePath} ${sourceFilePath}`);
    } catch (_) { /* ignore */ }
  }

  parentPort.postMessage({
    success,
    error,
    id: job.id,
    artifacts: success ? { wasm: wasmFileName, js: jsFileName, ir: null } : null
  });
});

// Surface unexpected errors to parent so a job doesn't hang silently
process.on('unhandledRejection', (reason) => {
  try { parentPort.postMessage({ success: false, error: `unhandledRejection: ${reason}` }); } catch (_) { }
});
process.on('uncaughtException', (err) => {
  try { parentPort.postMessage({ success: false, error: `uncaughtException: ${err.message}` }); } catch (_) { }
});