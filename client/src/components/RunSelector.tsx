import { useCallback } from 'react';
import { useAppState } from '../state';
import { Select } from './retroui/Select';

export const RunSelector = () => {
  const runs = useAppState(s => s.runs);
  const currentRunId = useAppState(s => s.currentRunId);
  const setCurrentRunId = useAppState(s => s.setCurrentRunId);

  const onValueChange = useCallback((value: string) => {
    if (value === 'none') {
      setCurrentRunId(undefined);
      return;
    }
    setCurrentRunId(value);
  }, [setCurrentRunId]);

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Select Run</h2>
      {/* <select
        value={currentRunId ?? ''}
        onChange={(e) => setCurrentRunId(e.target.value)}
      >
        <option value=''>-- Select a run --</option>
        {Object.values(runs).map(run => (
          <option key={run.id} value={run.id}>
            {run.id} - {run.status}
          </option>
        ))}
      </select> */}
      <Select onValueChange={onValueChange} value={currentRunId ?? ''}>
        <Select.Trigger>
          <Select.Value placeholder="-- Select a run --" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="none">-- Select a run --</Select.Item>
          {Object.values(runs).map(run => (
            // TODO: move onSelect to Select root
            <Select.Item
              key={run.id}
              value={run.id}
            >
              {run.id} - {run.status}
            </Select.Item>
          ))}
        </Select.Content>

      </Select>
    </div>
  );
}