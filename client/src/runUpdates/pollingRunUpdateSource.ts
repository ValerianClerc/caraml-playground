import { Run } from "../interfaces";

type RunUpdate = Pick<Run, 'id' | 'status' | 'errorMessage' | 'startedAt' | 'completedAt'>;

export interface RunUpdateSource {
  setTracked(ids: string[]): void; // replace tracked set (idempotent)
  start(): void; // begin producing updates
  stop(): void; // stop producing updates & release resources
  onUpdate(cb: (runs: RunUpdate[]) => void): () => void; // subscribe to updates (returns unsubscribe)
}

interface PollingOptions {
  intervalMs?: number;
  fetchRunStatus: (id: string) => Promise<RunUpdate>;
  autoUntrackResolved?: boolean; // remove succeeded/failed automatically
}

export function createPollingRunUpdateSource(opts: PollingOptions): RunUpdateSource {
  const intervalMs = opts.intervalMs ?? 1500;
  const tracked = new Set<string>();
  let timer: number | undefined;
  let running = false;
  const listeners = new Set<(runs: RunUpdate[]) => void>();
  let inFlight = false;

  function emit(runs: RunUpdate[]) {
    if (runs.length === 0) return;
    listeners.forEach(l => l(runs));
  }

  async function tick() {
    if (!running || tracked.size === 0 || inFlight) return;
    inFlight = true;
    try {
      const ids = Array.from(tracked);
      const results = await Promise.all(ids.map(async (id) => {
        try {
          return opts.fetchRunStatus(id);
        } catch (e) {
          // swallow individual errors; could mark run failed or leave unchanged
          return null;
        }
      }));

      const updated: RunUpdate[] = [];
      for (const r of results) {
        if (!r) continue;
        updated.push(r)
        if (opts.autoUntrackResolved && (r.status === 'succeeded' || r.status === 'failed')) {
          console.debug(`Auto-untracking resolved run ${r.id} with status ${r.status}`);
          tracked.delete(r.id);
        }
      }

      emit(updated);

      // If everything resolved and auto-untrack emptied the set -> stop timer
      if (tracked.size === 0 && opts.autoUntrackResolved) {
        stop();
      }
    } finally {
      inFlight = false;
    }
  }

  function ensureTimer() {
    if (timer != null) return;
    timer = window.setInterval(() => tick(), intervalMs);
  }

  function clearTimer() {
    if (timer != null) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  function start() {
    if (running) return;
    running = true;
    if (tracked.size > 0) ensureTimer();
  }

  function stop() {
    running = false;
    clearTimer();
  }

  return {
    setTracked(ids: string[]) {
      tracked.clear();
      ids.forEach(id => tracked.add(id));
      if (!running) return; // will start interval on next start()
      if (tracked.size === 0) {
        clearTimer();
      } else {
        ensureTimer();
      }
    },
    start,
    stop,
    onUpdate(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
