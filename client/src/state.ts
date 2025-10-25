import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed'] as const;

type RunStatus = typeof RUN_STATUSES[number];

type Run = {
  id: string;
  code: string;
  status: RunStatus;
};

interface AppState {
  runs: Record<string, Run>;
  currentRunId?: string;
  setCurrentRunId: (runId: string | undefined) => void;
  addOrUpdateRun: (run: Run) => void;
  removeRun: (id: string) => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      runs: {},
      currentRunId: undefined,
      setCurrentRunId: (runId) => set({ currentRunId: runId }),
      addOrUpdateRun: (run) =>
        set((state) => ({
          runs: { ...state.runs, [run.id]: run },
        })),
      removeRun: (id) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.runs;
          const currentRunId = state.currentRunId === id ? undefined : state.currentRunId;
          return { runs: rest, currentRunId };
        }),
    }),
    {
      name: "caraml-playground-state", // key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
