import { selectCurrentRun, useAppState } from "@/state";
import { Text } from "@/components/retroui/Text";
import { Button } from "@/components/retroui/Button";

export const CompilationTab = () => {
  const currentRun = useAppState(selectCurrentRun)

  let message = '';
  let statusColor = '';
  if (!currentRun) {
    message = 'No run selected. Compile new code, or view an existing run.';
  } else if (currentRun?.status === "failed") {
    message = `Compilation failed with error: ${currentRun?.errorMessage}`;
    statusColor = 'text-red-600';
  } else if (currentRun?.status !== "succeeded") {
    message = `Executable artifacts are only available for succeeded runs.`;
    statusColor = 'text-yellow-600';
  } else if (currentRun?.status === "succeeded") {
    statusColor = 'text-green-700';
  }

  return <div className="gap-2 flex flex-col">
    <Text>Compilation status: <span className={`font-semibold ${statusColor}`}>{currentRun?.status}</span></Text>
    <Text>{message}</Text>

    {currentRun?.code && (
      <>
        <Text as="h5">Source code:</Text>
        <code className="block whitespace-pre-wrap font-mono text-sm border-2 border-border rounded p-2">{currentRun?.code.trim()}</code>
      </>
    )}
  </div>
}