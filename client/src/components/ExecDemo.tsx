import { useEffect, useState } from 'react';
import { useExec } from '../exec/useExec';
import { API_URL } from '../constants';
import { useAppState } from '../state';

export function ExecDemo() {
  const currentRunId = useAppState(s => s.currentRunId);
  const runs = useAppState(s => s.runs);
  const currentRun = currentRunId ? runs[currentRunId] : undefined;
  const [stdoutLive, setStdoutLive] = useState<string[]>([]);
  const [stderrLive, setStderrLive] = useState<string[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [finalStdout, setFinalStdout] = useState('');
  const [finalStderr, setFinalStderr] = useState('');
  const [running, setRunning] = useState(false);

  const { loading, error, run } = useExec({
    onStdoutLine: (line) => setStdoutLive(prev => [...prev, line]),
    onStderrLine: (line) => setStderrLive(prev => [...prev, line]),
    execJsUrl: `${API_URL}/artifacts/${currentRunId}/js`,
    execWasmUrl: `${API_URL}/artifacts/${currentRunId}/wasm`
  });

  useEffect(() => {
    // clear last exec state state when currentRunId changes
    return () => {
      setStderrLive([]);
      setStdoutLive([]);
      setFinalStderr('');
      setFinalStdout('');
      setExitCode(null);
    }
  }, [currentRunId])

  const handleRun = async () => {
    setRunning(true);
    setExitCode(null);
    setStdoutLive([]);
    setStderrLive([]);
    setFinalStdout('');
    setFinalStderr('');
    try {
      const res = await run([]);
      setExitCode(res.exitCode);
      setFinalStdout(res.stdout);
      setFinalStderr(res.stderr);
    } finally {
      setRunning(false);
    }
  };

  if (!currentRunId) return <p>No run selected. Submit code, or view an existing run.</p>;
  if (currentRun?.status !== "succeeded") return <p>Compilation status is "{currentRun?.status}". Executable artifacts are only available for succeeded runs.</p>;
  if (loading) return <p>Loading executable...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Load error: {error}</p>;

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Run Executable</h2>
      <code>{currentRun?.code}</code>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button disabled={running} onClick={handleRun}>
          {running ? 'Running…' : 'Run'}
        </button>
        {exitCode !== null && (
          <span style={{ fontFamily: 'monospace' }}>exit={exitCode}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <details>
            <summary style={{ cursor: 'pointer' }}>stdout (live)</summary>
            <pre style={panelStyle}>
              {stdoutLive.length ? stdoutLive.join('\n') : '(empty)'}
            </pre>
          </details>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <details>
            <summary style={{ cursor: 'pointer' }}>stderr (live)</summary>
            <pre style={{ ...panelStyle, background: '#fef2f2', color: '#991b1b' }}>
              {stderrLive.length ? stderrLive.join('\n') : '(empty)'}
            </pre>
          </details>
        </div>
      </div>

      {(finalStdout || finalStderr || exitCode !== null) && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: '4px 0' }}>Final Result</h3>
          <details open>
            <summary style={{ cursor: 'pointer' }}>stdout</summary>
            <pre style={panelStyle}>{finalStdout || '(empty)'}</pre>
          </details>
          <details>
            <summary style={{ cursor: 'pointer' }}>stderr</summary>
            <pre style={{ ...panelStyle, background: '#fef2f2', color: '#991b1b' }}>{finalStderr || '(empty)'}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#f1f5f9',
  padding: 8,
  minHeight: 120,
  whiteSpace: 'pre-wrap',
  fontSize: 13,
  overflowY: 'auto',
  border: '1px solid #e2e8f0',
  borderRadius: 4
};