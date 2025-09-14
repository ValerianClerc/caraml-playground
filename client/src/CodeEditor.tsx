import { useCallback, useState } from "react";
import { factorial } from "./codeSamples";
import { API_URL } from "./constants";

export const CodeEditor = () => {
  const [code, setCode] = useState(factorial);

  const handleSubmit = useCallback(() => {
    console.log("Submitted code:", code);

    fetch(`${API_URL}/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceCode: code
      }),
    });
  }, [code]);

  return (
    <div>
      <h2>Code Editor</h2>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: '100%', height: 300, fontFamily: 'monospace', fontSize: 14 }}
        defaultValue={factorial}
      />
      <button onClick={handleSubmit}>Submit Code</button>
    </div>
  );
}