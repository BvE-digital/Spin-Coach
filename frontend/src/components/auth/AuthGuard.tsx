import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { FullPageSpinner } from '../ui/Spinner'

// Demo mode: no real Azure AD credentials configured
const DEMO_MODE = !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === ''

export function AuthGuard() {
  const { instance, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    void instance.handleRedirectPromise().catch(console.error)
  }, [instance])

  // In demo mode, bypass auth entirely
  if (DEMO_MODE) return <Outlet />

  if (inProgress !== InteractionStatus.None) {
    return <FullPageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
