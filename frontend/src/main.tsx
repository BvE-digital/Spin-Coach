import React from 'react'
import ReactDOM from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/msalConfig'
import App from './App'
import './index.css'

// CRITICAL: await MSAL initialisation before React renders.
// This ensures handleRedirectPromise() can consume the auth code
// from the URL before the component tree mounts — prevents redirect loops.
msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  )
}).catch(console.error)
