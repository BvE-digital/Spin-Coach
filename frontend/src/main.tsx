import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/msalConfig'
import App from './App'
import './index.css'

// In standalone (single-file) builds, intercept all /api/* fetch calls
// so the app works without any backend server.
if (import.meta.env.VITE_STANDALONE === 'true') {
  // Import is synchronous in bundled context; mock is tree-shaken in normal builds
  const { installMockFetch } = await import('./mocks/mockFetch')
  installMockFetch()
}

// CRITICAL: await MSAL initialisation before React renders.
msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  )
}).catch(console.error)
