import { useCallback, useEffect, useRef, useState } from 'react';
import { loadExec, ExecModuleHandle, LoadExecOptions } from './execLoader';

export interface UseExecOptions extends LoadExecOptions { }

export function useExec({ execJsUrl, execWasmUrl, onStdoutLine, onStderrLine }: UseExecOptions) {
  const [loading, setLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const execRef = useRef<ExecModuleHandle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: find a way to cancel WASM execution?
      const exec = await loadExec({
        onStdoutLine,
        onStderrLine,
        execJsUrl,
        execWasmUrl,

      });
      execRef.current = exec;
      setLoading(false);
    } catch (e: any) {
      setModuleError(String(e?.message ?? e));
      setLoading(false);
    }
  }, [execJsUrl, execWasmUrl, onStdoutLine, onStderrLine]);

  const run = useCallback(async (args: string[] = []) => {
    if (!execRef.current) await load();

    if (!execRef.current) {
      throw new Error('Exec module not loaded');
    }
    return execRef.current.run(args);
  }, [load]);

  useEffect(() => {
    return () => {
      execRef.current?.dispose(); // TODO: implement
      execRef.current = null;
    }
  }, [execJsUrl, execWasmUrl]);

  return { loading, error: moduleError, run };
}