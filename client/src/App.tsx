import { ExecDemo } from './ExecDemo'
import { CodeEditor } from './CodeEditor'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Roboto, "Segoe UI", sans-serif', padding: 24 }}>
      <CodeEditor />
      <ExecDemo />
    </div>
  )
}

