import { ExecDemo } from './components/ExecDemo'
import { CodeEditor } from './components/CodeEditor'
import { useRunUpdateCoordinator } from './runUpdates/useRunUpdateCoordinator'
import { RunSelector } from './components/RunSelector';

export default function App() {
  useRunUpdateCoordinator();
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Roboto, "Segoe UI", sans-serif', padding: 24 }}>
      <CodeEditor />
      <RunSelector />
      <ExecDemo />
    </div>
  )
}

