import { ExecDemo } from './components/ExecDemo'
import { CodeEditor } from './components/CodeEditor'
import { useRunUpdateCoordinator } from './runUpdates/useRunUpdateCoordinator'
import { RunSelector } from './components/RunSelector';

export default function App() {
  useRunUpdateCoordinator();
  return (
    <div>
      <CodeEditor />
      <RunSelector />
      <ExecDemo />
    </div>
  )
}

