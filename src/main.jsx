import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyStoredTheme } from '@/lib/theme'

// Before the first paint, so the app does not flash light and correct itself.
applyStoredTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
