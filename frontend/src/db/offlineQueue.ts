import { useEffect } from 'react'
import { getPendingSessions, updateSyncStatus } from './sessionDb'
import { useUIStore } from '../store/uiStore'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/msalConfig'
import { ENDPOINTS } from '../config/apiConfig'
import type { D365SyncResponse } from '../types/d365'
import type { Session } from '../types/session'

async function syncSession(session: Session, token: string): Promise<void> {
  await updateSyncStatus(session.id, 'syncing')

  const res = await fetch(ENDPOINTS.d365Sync, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`D365 sync failed: ${res.status} ${text}`)
  }

  const data: D365SyncResponse = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Sync failed')

  await updateSyncStatus(session.id, 'synced', { d365Ids: data.d365Ids })
}

// Mounted once at AppShell level; auto-flushes pending queue when online
export function useOfflineQueue(): void {
  const isOnline = useUIStore((s) => s.isOnline)
  const { instance, accounts } = useMsal()

  useEffect(() => {
    if (!isOnline || accounts.length === 0) return

    async function flush(): Promise<void> {
      const pending = await getPendingSessions()
      if (pending.length === 0) return

      let token: string
      try {
        const result = await instance.acquireTokenSilent({
          scopes: loginRequest.scopes,
          account: accounts[0],
        })
        token = result.accessToken
      } catch {
        return // Will retry on next online event
      }

      for (const session of pending) {
        try {
          await syncSession(session, token)
        } catch (err) {
          await updateSyncStatus(session.id, 'error', {
            syncError: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    void flush()
  }, [isOnline, instance, accounts])
}
