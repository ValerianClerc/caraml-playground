import { useState } from 'react';
import { useFibExec } from './useFibExec';

export function FibExecDemo() {
  const { loading, error, run } = useFibExec();
  const [n, setN] = useState('20');
  const [output, setOutput] = useState<string>('');
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setOutput('');
    setExitCode(null);
    try {
      const res = await run([n]);
      setOutput(
        [
          '--- stdout ---',
          res.stdout || '(empty)',
          '--- stderr ---',
          res.stderr || '(empty)'
        ].join('\\n')
      );
      setExitCode(res.exitCode);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <p>Loading executable...</p>;
  if (error) return <p style={ { color: 'crimson' } }> Load error: { error } </p>;

  return (
    <div style= {{ marginTop: 24 }
}>
  <h2>Run fib executable </h2>
    <label>
n:& nbsp;
<input
          value={ n }
onChange = { e => setN(e.target.value) }
style = {{ width: 80 }}
          />
  </label>
  < button disabled = { running } onClick = { handleRun } style = {{ marginLeft: 8 }}>
    { running? 'Running...': 'Run' }
    </button>
{ exitCode !== null && <p>Exit code: { exitCode } </p> }
{ output && <pre style={ { background: '#f1f5f9', padding: 12, whiteSpace: 'pre-wrap' } }> { output } </pre> }
</div>
  );
}