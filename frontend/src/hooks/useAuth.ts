import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/msalConfig'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null

  async function getAccessToken(scopes: string[] = loginRequest.scopes): Promise<string> {
    if (!account) throw new Error('No account signed in')
    try {
      const result = await instance.acquireTokenSilent({ scopes, account })
      return result.accessToken
    } catch {
      await instance.acquireTokenRedirect({ scopes, account })
      throw new Error('Redirecting for token')
    }
  }

  function logout() {
    void instance.logoutRedirect()
  }

  return { account, getAccessToken, logout }
}
