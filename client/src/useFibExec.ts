import { useCallback, useEffect, useRef, useState } from 'react';
import { loadExec, ExecModuleHandle, ExecResult } from './execLoader';

export function useFibExec() {
  const [loading, setLoading] = useState(true);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const execRef = useRef<ExecModuleHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const exec = await loadExec();
        if (!cancelled) {
          execRef.current = exec;
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setModuleError(String(e?.message ?? e));
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const run = useCallback(async (args: string[] = []) => {
    if (!execRef.current) throw new Error('Executable not loaded');
    return execRef.current.run(args);
  }, []);

  return { loading, error: moduleError, run };
}