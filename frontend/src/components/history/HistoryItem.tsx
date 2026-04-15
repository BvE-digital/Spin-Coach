import type { Session, SpinStage } from '../../types/session'
import { SyncStatusBadge } from './SyncStatusBadge'

const STAGES: SpinStage[] = ['S', 'P', 'I', 'N']

function spinCoverage(session: Session): Set<SpinStage> {
  const covered = new Set<SpinStage>()
  if (!session.extraction) return covered
  const { situationScore, problemScore, implicationScore, needPayoffScore } =
    session.extraction.overallSpinCoverage
  if (situationScore > 0.3) covered.add('S')
  if (problemScore > 0.3) covered.add('P')
  if (implicationScore > 0.3) covered.add('I')
  if (needPayoffScore > 0.3) covered.add('N')
  return covered
}

interface Props {
  session: Session
  onRetrySync?: (id: string) => void
  onClick?: (id: string) => void
}

export function HistoryItem({ session, onRetrySync, onClick }: Props) {
  const covered = spinCoverage(session)
  const dateStr = new Date(session.visitDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={() => onClick?.(session.id)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-nutreco-blue/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-nutreco-neutral truncate">{session.account.name}</div>
          <div className="text-sm text-gray-400 mt-0.5">{dateStr}</div>
        </div>
        <SyncStatusBadge status={session.syncStatus} />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-400 mr-1">SPIN:</span>
        {STAGES.map((stage) => (
          <span
            key={stage}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              covered.has(stage)
                ? 'bg-nutreco-lime text-nutreco-neutral'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            {stage}
          </span>
        ))}

        {session.syncStatus === 'error' && onRetrySync && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRetrySync(session.id)
            }}
            className="ml-auto text-xs text-nutreco-blue hover:underline font-medium"
          >
            Retry Sync
          </button>
        )}
      </div>
    </button>
  )
}
