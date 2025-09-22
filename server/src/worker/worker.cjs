const { parentPort } = require('worker_threads');
const { exec } = require('child_process');
const { promisify } = require('util');
const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');

const execAsync = promisify(exec);

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
    fs.writeFileSync(sourceFilePath, job.sourceCode ?? '', 'utf8');

    // TODO: replace with actual caraml compile command producing LLVM IR
    await execAsync(`touch ${llvmFilePath} && echo "; mock ll for ${job.id}" > ${llvmFilePath}`);

    // TODO: replace with actual JS + WASM generation (emscripten / custom toolchain)
    await execAsync(`touch ${jsFilePath} && echo "// mock js for ${job.id}" > ${jsFilePath}`);
    await execAsync(`touch ${wasmFilePath} && echo "(module)" > ${wasmFilePath}`);

    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://caramlblob.blob.core.windows.net`,
      credential
    );
    const containerClient = blobServiceClient.getContainerClient('artifacts');
    const wasmBlockBlobClient = containerClient.getBlockBlobClient(wasmFileName);
    await wasmBlockBlobClient.uploadFile(wasmFilePath, {
      blobHTTPHeaders: { blobContentType: 'application/wasm' },
    });
    const jsBlockBlobClient = containerClient.getBlockBlobClient(jsFileName);
    await jsBlockBlobClient.uploadFile(jsFilePath, {
      blobHTTPHeaders: { blobContentType: 'application/javascript' },
    });
    console.log(`[worker ${job.id}] Uploaded artifacts`);
    success = true;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error(`[worker ${job.id}] error`, e);
  } finally {
    try {
      await execAsync(`rm -f ${llvmFilePath} ${jsFilePath} ${wasmFilePath} ${sourceFilePath}`);
    } catch (_) { /* ignore */ }
  }

  parentPort.postMessage({
    success,
    error,
    id: job.id,
    artifacts: success ? { wasm: wasmFileName, js: jsFileName } : null
  });
});

// Surface unexpected errors to parent so a job doesn't hang silently
process.on('unhandledRejection', (reason) => {
  try { parentPort.postMessage({ success: false, error: `unhandledRejection: ${reason}` }); } catch (_) { }
});
process.on('uncaughtException', (err) => {
  try { parentPort.postMessage({ success: false, error: `uncaughtException: ${err.message}` }); } catch (_) { }
});