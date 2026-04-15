import type { SyncStatus } from '../../types/session'

const CONFIG: Record<SyncStatus, { label: string; classes: string }> = {
  synced: { label: 'Synced', classes: 'bg-nutreco-teal/10 text-nutreco-teal border-nutreco-teal/30' },
  pending_sync: { label: 'Pending', classes: 'bg-nutreco-orange/10 text-nutreco-orange border-nutreco-orange/30' },
  syncing: { label: 'Syncing…', classes: 'bg-nutreco-blue/10 text-nutreco-blue border-nutreco-blue/30' },
  error: { label: 'Error', classes: 'bg-nutreco-red/10 text-nutreco-red border-nutreco-red/30' },
  in_progress: { label: 'In Progress', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  discarded: { label: 'Discarded', classes: 'bg-gray-100 text-gray-400 border-gray-200' },
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const { label, classes } = CONFIG[status] ?? CONFIG.in_progress
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${classes}`}>
      {label}
    </span>
  )
}
