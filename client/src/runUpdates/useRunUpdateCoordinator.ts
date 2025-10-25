import { useEffect, useRef } from 'react';
import { useAppState } from '../state';
import { createPollingRunUpdateSource, RunUpdateSource } from './pollingRunUpdateSource';
import { fetchRunStatus } from '../api';

export function useRunUpdateCoordinator() {
  const runs = useAppState(s => s.runs)
  const addOrUpdateRun = useAppState(s => s.addOrUpdateRun);
  const sourceRef = useRef<RunUpdateSource>();

  if (!sourceRef.current) {
    sourceRef.current = createPollingRunUpdateSource({
      intervalMs: 1500,
      fetchRunStatus,
      autoUntrackResolved: true,
    });
  }
  useEffect(() => {
    sourceRef.current?.onUpdate(updated => {
      updated.forEach(r => {
        const existing = runs[r.id];
        addOrUpdateRun({ ...existing, ...r });
      });
    });
  }, [runs]);

  // Update tracked IDs whenever run map changes
  useEffect(() => {
    const activeIds = Object.values(runs)
      .filter(r => r.status === 'pending' || r.status === 'running')
      .map(r => r.id);
    sourceRef.current?.setTracked(activeIds);
    if (activeIds.length > 0) {
      sourceRef.current?.start();
    } else {
      sourceRef.current?.stop();
    }
  }, [runs]);

  // Cleanup on unmount
  useEffect(() => () => sourceRef.current?.stop(), []);
}
