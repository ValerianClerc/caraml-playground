import { useCallback, useState } from "react";
import { factorial } from "./codeSamples";
import { queueCompilation } from "./api";
import { useAppState } from "./state";

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

  return (
    <div>
      <h2>Code Editor</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: '100%', height: 300, fontFamily: 'monospace', fontSize: 14 }}
      />
      <button onClick={handleSubmit}>Submit Code</button>
    </div>
  );
}