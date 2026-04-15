import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { FullPageSpinner } from '../ui/Spinner'

export function AuthGuard() {
  const { instance, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    // Handle the redirect response returned from Azure AD
    void instance.handleRedirectPromise().catch(console.error)
  }, [instance])

  // MSAL is processing the redirect response or a token request
  if (inProgress !== InteractionStatus.None) {
    return <FullPageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
