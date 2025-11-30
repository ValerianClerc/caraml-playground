import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { Tooltip } from './components/retroui/Tooltip'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <Tooltip.Provider delayDuration={200}>
      <App />
    </Tooltip.Provider>
  </React.StrictMode>
)
