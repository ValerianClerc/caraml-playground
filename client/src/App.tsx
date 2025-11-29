import { useRunUpdateCoordinator } from './runUpdates/useRunUpdateCoordinator'
import { CodeEditorLayout } from './pages/CodeEditorLayout';

export default function App() {
  useRunUpdateCoordinator();
  return (
    <div className='h-screen'>
      <CodeEditorLayout />
    </div>
  )
}

