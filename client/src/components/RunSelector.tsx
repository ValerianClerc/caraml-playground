import { useAppState } from '../state';

export const RunSelector = () => {
  const runs = useAppState(s => s.runs);
  const currentRunId = useAppState(s => s.currentRunId);
  const setCurrentRunId = useAppState(s => s.setCurrentRunId);

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Select Run</h2>
      <select
        value={currentRunId ?? ''}
        onChange={(e) => setCurrentRunId(e.target.value)}
      >
        <option value=''>-- Select a run --</option>
        {Object.values(runs).map(run => (
          <option key={run.id} value={run.id}>
            {run.id} - {run.status}
          </option>
        ))}
      </select>
    </div>
  );
}