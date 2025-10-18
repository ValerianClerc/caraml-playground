import { useState } from 'react';
import { useExec } from './useExec';
import { API_URL } from './constants';

export function ExecDemo() {
  const [stdoutLive, setStdoutLive] = useState<string[]>([]);
  const [stderrLive, setStderrLive] = useState<string[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [finalStdout, setFinalStdout] = useState('');
  const [finalStderr, setFinalStderr] = useState('');
  const [running, setRunning] = useState(false);

  const { loading, error, run } = useExec({
    onStdoutLine: (line) => setStdoutLive(prev => [...prev, line]),
    onStderrLine: (line) => setStderrLive(prev => [...prev, line]),
    execJsUrl: `${API_URL}/artifacts/c75400f7-6cbf-46ce-a69b-c7bc4def8d31/js`,
    execWasmUrl: `${API_URL}/artifacts/c75400f7-6cbf-46ce-a69b-c7bc4def8d31/wasm`
  });

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

  if (loading) return <p>Loading executable...</p>;
  if (error) return <p style={{ color: 'crimson' }}>Load error: {error}</p>;

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Run Executable</h2>
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
          <h3 style={{ margin: '4px 0' }}>stdout (live)</h3>
          <pre style={panelStyle}>
            {stdoutLive.length ? stdoutLive.join('\n') : '(empty)'}
          </pre>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: '4px 0' }}>stderr (live)</h3>
          <pre style={{ ...panelStyle, background: '#fef2f2', color: '#991b1b' }}>
            {stderrLive.length ? stderrLive.join('\n') : '(empty)'}
          </pre>
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