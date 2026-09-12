import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyStoredTheme } from '@/lib/theme'
import { registerServiceWorker } from '@/lib/offline'
import { watchForConnection } from '@/lib/replayQueue'

// Before the first paint, so the app does not flash light and correct itself.
applyStoredTheme()

// So the app opens without a connection instead of spinning. It caches the
// shell only — never the log, because a stale medical record is worse than no
// record.
registerServiceWorker()

// A write that failed on a dead connection is sent when one comes back —
// including a connection that came back while the app was closed, which is the
// common case rather than the exotic one.
watchForConnection()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
