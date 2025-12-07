import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Run } from "./interfaces";


interface AppState {
  runs: Record<string, Run>;
  currentRunId?: string;
  setCurrentRunId: (runId: string | undefined) => void;
  addOrUpdateRun: (run: Run) => void;
  removeRun: (id: string) => void;
  clearRuns: () => void;
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
      clearRuns: () => set({ runs: {}, currentRunId: undefined }),
    }),
    {
      name: "caraml-playground-state", // key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const selectCurrentRun = (state: AppState) => state.currentRunId ? state.runs[state.currentRunId] : undefined