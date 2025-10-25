// execLoader.ts
// Utility to load the modularized executable and run main on demand with args.
// Files served from public/: /exec.js & /exec.wasm

export interface ExecResult {
  exitCode: number;
  stdout: string;        // joined with \n
  stderr: string;        // joined with \n
  stdoutLines: string[]; // individual lines (exact chunks captured)
  stderrLines: string[];
}

export interface LoadExecOptions {
  onStdoutLine?: (line: string) => void;
  onStderrLine?: (line: string) => void;
  /**
   * URL (absolute or relative) to the Emscripten glue JS file (built with MODULARIZE=1).
   * Defaults to '/exec.js'. May be cross-origin; script tag insert does not require CORS.
   */
  execJsUrl: string;
  /**
   * URL (absolute or relative) to the associated wasm binary. Defaults to '/exec.wasm'.
   * Cross-origin allowed if server sends proper CORS headers (Emscripten's fetch requires it).
   */
  execWasmUrl: string;
  /**
   * Force reloading the script tag even if one with the same URL was already injected.
   * Useful for hot reloading / version switching.
   */
  forceReloadScript?: boolean;
}

export interface ExecModuleHandle {
  run: (args?: string[]) => Promise<ExecResult>;
  dispose: () => void;
}

export async function loadExec(opts: LoadExecOptions): Promise<ExecModuleHandle> {
  const {
    onStdoutLine,
    onStderrLine,
    execJsUrl,
    execWasmUrl,
    forceReloadScript = false
  } = opts;

  let stdoutBuf: string[] = [];
  let stderrBuf: string[] = [];
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('loadExec() must be called in a browser environment (window/document not available).');
  }
  // Inject the script for the glue code. If already present for this exact URL, reuse unless forceReloadScript.
  function ensureScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const selector = `script[data-exec-glue="${execJsUrl}"]`;
      const existing = document.querySelector(selector);
      if (existing && !forceReloadScript) {
        resolve();
        return;
      }
      if (existing && forceReloadScript) existing.remove();
      const s = document.createElement('script');
      s.src = execJsUrl;
      s.async = true;
      s.dataset.execGlue = execJsUrl; // attribute keyed by URL allows multiple distinct modules
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${execJsUrl}`));
      document.head.appendChild(s);
    });
  }

  await ensureScript();

  async function findFactory(retries = 3, delayMs = 10): Promise<any> {
    for (let i = 0; i < retries; i++) {
      const cand = globalThis.createExec || globalThis.Module //|| globalThis.default;
      if (cand) return cand;
      // Wait a tick (some bundlers defer var hoisting until microtask end)
      await new Promise(r => setTimeout(r, delayMs));
    }
    return null;
  }

  let factory = await findFactory();

  // Fallback: fetch + eval if not found (e.g., CSP permitting) – handles cases where script tag blocked or scope isolated.
  if (!factory) {
    try {
      const resp = await fetch(execJsUrl);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const code = await resp.text();
      // Evaluate in global scope; wrap to return factory variable if defined.
      factory = (0, eval)(code + '\n; (typeof createExec!=="undefined" ? createExec : undefined);');
    } catch (e: any) {
      throw new Error('Failed to locate Emscripten factory (attempted load + eval): ' + (e?.message || String(e)));
    }
  }

  if (!factory) {
    throw new Error(`Emscripten factory still not found. Ensure build used: -s MODULARIZE=1 -s EXPORT_NAME="createExec" and that ${execJsUrl} doesn't set type="module".`);
  }

  const Module = await factory({
    locateFile: (p: string) => (p.endsWith('.wasm') ? execWasmUrl : p),
    print: (text: string) => {
      stdoutBuf.push(text);
      onStdoutLine?.(text);
    },
    printErr: (text: string) => {
      stderrBuf.push(text);
      onStderrLine?.(text);
    }
  });

  if (typeof Module.callMain !== 'function') {
    throw new Error('Expected Module.callMain. Rebuild with -s EXPORTED_RUNTIME_METHODS=["callMain"] and ensure -s INVOKE_RUN=0.');
  }

  const run = async (args: string[] = []): Promise<ExecResult> => {
    stdoutBuf = [];
    stderrBuf = [];
    // TODO: validate that inputs work, once IO is added to CaraML
    Module.arguments = ['exec', ...args];
    let exitCode = 0;
    try {
      exitCode = Module.callMain(Module.arguments);
    } catch (e: any) {
      if (typeof e === 'number') {
        exitCode = e;
      } else {
        stderrBuf.push(String(e?.message ?? e));
        exitCode = 1;
      }
    }
    return {
      exitCode,
      stdout: stdoutBuf.join('\n'),
      stderr: stderrBuf.join('\n'),
      stdoutLines: [...stdoutBuf],
      stderrLines: [...stderrBuf]
    };
  };

  const dispose = () => {
    // TODO: clean up memory after each run
    // Not a full teardown; EXIT_RUNTIME=1 lets callMain unwind runtime.
    // To fully free memory, you'd create a new Module instance each run.
  };

  return { run, dispose };
}