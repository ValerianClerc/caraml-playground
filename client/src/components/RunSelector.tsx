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
    <div className="w-100">
      <Select onValueChange={onValueChange} value={currentRunId ?? ''} >
        <Select.Trigger className='min-w-60'>
          <Select.Value placeholder="-- Select a run --" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="none">-- Select a run --</Select.Item>
          {Object.values(runs).map((run, index) => (
            <Select.Item
              key={run.id}
              value={run.id}
            >
              Run #{index} - {run.status}
            </Select.Item>
          ))}
        </Select.Content>

      </Select>
    </div>
  );
}