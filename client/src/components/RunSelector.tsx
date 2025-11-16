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
    <div >
      <h2>Select Run</h2>
      <Select onValueChange={onValueChange} value={currentRunId ?? ''}>
        <Select.Trigger>
          <Select.Value placeholder="-- Select a run --" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="none">-- Select a run --</Select.Item>
          {Object.values(runs).map(run => (
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