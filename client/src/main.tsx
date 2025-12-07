import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { Tooltip } from './components/retroui/Tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={200}>
        <App />
      </Tooltip.Provider>
    </QueryClientProvider>
  </React.StrictMode>
)
