import { ChangeEvent, useCallback, useState } from "react";
import { factorial } from "@/codeSamples";
import { queueCompilation } from "@/api";
import { selectCurrentRun, useAppState } from "@/state";
import { ExampleSelector } from "./ExampleSelector";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { Loader } from "./retroui/Loader";

export const CodeEditor = () => {
  const [code, setCode] = useState(factorial);
  const setCurrentRunId = useAppState(state => state.setCurrentRunId);
  const currentRun = useAppState(selectCurrentRun)
  const addOrUpdateRun = useAppState(state => state.addOrUpdateRun);

  const handleSubmit = useCallback(async () => {
    queueCompilation(code)
      .then(response => {

        addOrUpdateRun({ id: response.id, code, status: response.status });
        setCurrentRunId(response.id);
        console.log('Compilation queued, job ID:', response.id);
      })
      .catch(error => {
        console.error('Error queueing compilation:', error);
      })
  }, [code]);

  const onExampleSelected = useCallback((exampleCode: string) => {
    setCode(exampleCode);
  }, []);

  const isCompiling = currentRun?.status === "pending" || currentRun?.status === "running"
  const compileButtonContent = isCompiling ? <Loader className="p-1" /> : "Compile Code"

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 flex-none justify-between pb-2">
        <ExampleSelector onExampleSelected={onExampleSelected} />
        <Button className="h-10" variant="default" onClick={handleSubmit} disabled={isCompiling}>{compileButtonContent}</Button>
      </div>
      <Textarea
        className="flex-1 min-h-0 font-mono"
        value={code}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
      />
    </div>
  );
}