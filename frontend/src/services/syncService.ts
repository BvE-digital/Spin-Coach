import { msalInstance, loginRequest } from '../config/msalConfig'
import { ENDPOINTS } from '../config/apiConfig'
import type { Session } from '../types/session'
import type { D365SyncResponse } from '../types/d365'

export const syncService = {
  async sync(session: Session): Promise<D365SyncResponse> {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length === 0) throw new Error('Not authenticated')

    const result = await msalInstance.acquireTokenSilent({
      scopes: loginRequest.scopes,
      account: accounts[0],
    })

    const res = await fetch(ENDPOINTS.d365Sync, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${result.accessToken}`,
      },
      body: JSON.stringify({ session }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Sync failed: ${res.status} ${text}`)
    }

    return res.json() as Promise<D365SyncResponse>
  },
}
