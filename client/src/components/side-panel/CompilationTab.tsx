import { selectCurrentRun, useAppState } from "@/state";

export const CompilationTab = () => {
  const currentRun = useAppState(selectCurrentRun)

  if (!currentRun) return <p>No run selected. Compile new code, or view an existing run.</p>;
  if (currentRun?.status === "failed") return <p>Compilation failed with error: {currentRun?.errorMessage}</p>;
  if (currentRun?.status !== "succeeded") return <p>Compilation status is "{currentRun?.status}". Executable artifacts are only available for succeeded runs.</p>;

  return <p>Compilation succeeded!</p>
}