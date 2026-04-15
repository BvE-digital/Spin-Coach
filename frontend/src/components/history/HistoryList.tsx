import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { getSessionsByRep, updateSyncStatus } from '../../db/sessionDb'
import { syncService } from '../../services/syncService'
import { HistoryItem } from './HistoryItem'
import { Spinner } from '../ui/Spinner'
import type { Session } from '../../types/session'
import toast from 'react-hot-toast'

export function HistoryList() {
  const navigate = useNavigate()
  const { accounts } = useMsal()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    const repId = accounts[0]?.localAccountId ?? ''
    const all = await getSessionsByRep(repId)
    setSessions(all.filter((s) => s.syncStatus !== 'in_progress' && s.syncStatus !== 'discarded'))
    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRetrySync(id: string) {
    const session = sessions.find((s) => s.id === id)
    if (!session) return
    await updateSyncStatus(id, 'pending_sync')
    try {
      const result = await syncService.sync(session)
      if (result.success) {
        await updateSyncStatus(id, 'synced', { d365Ids: result.d365Ids })
        toast.success('Synced successfully')
      }
    } catch (err) {
      await updateSyncStatus(id, 'error', {
        syncError: err instanceof Error ? err.message : String(err),
      })
      toast.error('Sync failed — will retry when online')
    }
    void load()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-nutreco-blue">Session History</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-nutreco-neutral">
          <p className="text-4xl mb-4">📋</p>
          <p className="font-medium mb-1">No sessions yet</p>
          <p className="text-sm text-gray-400">
            Complete a debrief session to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <HistoryItem
              key={session.id}
              session={session}
              onRetrySync={(id) => void handleRetrySync(id)}
              onClick={() => navigate(`/history/${session.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
