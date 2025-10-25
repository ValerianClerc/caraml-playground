import { ExecDemo } from './ExecDemo'
import { CodeEditor } from './CodeEditor'
import { useRunUpdateCoordinator } from './runUpdates/useRunUpdateCoordinator'

export default function App() {
  useRunUpdateCoordinator();
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Roboto, "Segoe UI", sans-serif', padding: 24 }}>
      <CodeEditor />
      <ExecDemo />
    </div>
  )
}

