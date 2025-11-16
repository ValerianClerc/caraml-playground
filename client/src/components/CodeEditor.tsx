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
    <div>
      <h2>Code Editor</h2>
      <ExampleSelector onExampleSelected={onExampleSelected} />
      <Textarea
        value={code}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
        style={{ width: '100%', height: 300, fontFamily: 'monospace', fontSize: 14 }}
      />
      <Button variant="default" onClick={handleSubmit}>Compile Code</Button>
    </div>
  );
}