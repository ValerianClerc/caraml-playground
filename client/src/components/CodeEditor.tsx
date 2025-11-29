import { ChangeEvent, useCallback, useState } from "react";
import { factorial } from "@/codeSamples";
import { queueCompilation } from "@/api";
import { useAppState } from "@/state";
import { ExampleSelector } from "./ExampleSelector";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";

export const CodeEditor = () => {
  const [code, setCode] = useState(factorial);
  const setCurrentRunId = useAppState(state => state.setCurrentRunId);
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
      });
  }, [code]);

  const onExampleSelected = useCallback((exampleCode: string) => {
    setCode(exampleCode);
  }, []);

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 flex-none justify-between pb-2">
        <ExampleSelector onExampleSelected={onExampleSelected} />
        <Button className="h-fit" variant="default" onClick={handleSubmit}>Compile Code</Button>
      </div>
      <Textarea
        className="flex-1 min-h-0 font-mono"
        value={code}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
      />
    </div>
  );
}