import { useCallback, useEffect, useRef, useState } from 'react';
import { loadExec, ExecModuleHandle, LoadExecOptions } from './execLoader';

export interface UseExecOptions extends Omit<LoadExecOptions, 'onStdoutLine' | 'onStderrLine'> { }
export interface UseExecReturn {
  loading: boolean;
  error: string | null;
  run: (args?: string[]) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
  clear: () => void;
  stdout: string;
  stderr: string;
}

export function useExec({ execJsUrl, execWasmUrl }: UseExecOptions): UseExecReturn {
  const [loading, setLoading] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const execRef = useRef<ExecModuleHandle | null>(null);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');

  const onStdoutLine = useCallback((line: string) => {
    setStdout(prev => `${prev}${new Date().toISOString()}: ${line}\n`)
  }, []);

  const onStderrLine = useCallback((line: string) => {
    setStderr(prev => `${prev}${new Date().toISOString()} ${line}\n`)
  }, []);

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
    setStdout('');
    setStderr('');
    return execRef.current.run(args);
  }, [load]);

  useEffect(() => {
    return () => {
      execRef.current?.dispose(); // TODO: implement
      execRef.current = null;
    }
  }, [execJsUrl, execWasmUrl]);

  const clear = useCallback(() => {
    execRef.current?.dispose(); // TODO: implement
    execRef.current = null;

    setModuleError(null);
    setStdout('');
    setStderr('');
  }, []);

  return { loading, error: moduleError, run, clear, stderr, stdout };
}