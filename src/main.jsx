import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyStoredTheme } from '@/lib/theme'
import { registerServiceWorker } from '@/lib/offline'

// Before the first paint, so the app does not flash light and correct itself.
applyStoredTheme()

// So the app opens without a connection instead of spinning. It caches the
// shell only — never the log, because a stale medical record is worse than no
// record.
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
