import { selectCurrentRun, useAppState } from "@/state";
import { Text } from "@/components/retroui/Text";
import { Button } from "@/components/retroui/Button";
import { Code } from "../Code";
import { useCallback } from "react";
import { RunFunc } from "@/exec/useExec";

type Props = {
  run: RunFunc;
  navigateToExecTab: () => void;
}

export const CompilationTab = ({ run, navigateToExecTab }: Props) => {
  const currentRun = useAppState(selectCurrentRun)

  const onRunClick = useCallback(() => {
    run();
    navigateToExecTab();
  }, [run, navigateToExecTab]);

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
        <Code>{currentRun?.code.trim()}</Code>
      </>
    )}

    <Button className="w-fit self-end" disabled={currentRun?.status !== "succeeded"} disabledText="You must compile code before you can run it" onClick={onRunClick}>Run</Button>
  </div>
}