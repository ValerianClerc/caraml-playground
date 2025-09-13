import { useEffect, useState } from 'react'
import { ExecDemo } from './ExecDemo'

export default function App() {
  const [hello, setHello] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/hello.txt')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setHello(text)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Roboto, "Segoe UI", sans-serif', padding: 24 }}>
      <h1>Vite + React + TypeScript</h1>
      <p>This is a minimal scaffold created in the <code>client/</code> folder.</p>

      <section style={{ marginTop: 20 }}>
        <h2>Static asset: /hello.txt</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
        {hello && <pre style={{ background: '#f1f5f9', padding: 12 }}>{hello}</pre>}
        <ExecDemo />
      </section>
    </div>
  )
}

