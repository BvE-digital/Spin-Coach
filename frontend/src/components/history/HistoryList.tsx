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
    <div className="space-y-5 pb-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-nutreco-blue leading-tight">Session History</h1>
        <p className="text-nutreco-neutral text-sm mt-1">
          {sessions.length > 0
            ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} recorded`
            : 'Your debrief sessions will appear here'}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-nutreco-blue/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-nutreco-blue" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="font-semibold text-nutreco-neutral mb-1">No sessions yet</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
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
