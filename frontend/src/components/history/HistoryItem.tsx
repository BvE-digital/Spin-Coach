import type { Session, SpinStage } from '../../types/session'
import { SyncStatusBadge } from './SyncStatusBadge'

const STAGES: { key: SpinStage }[] = [
  { key: 'S' },
  { key: 'P' },
  { key: 'I' },
  { key: 'N' },
]

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
  const coverCount = covered.size
  const dateStr = new Date(session.visitDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={() => onClick?.(session.id)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-nutreco-blue/30 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-nutreco-blue/10 flex items-center justify-center flex-shrink-0">
            <span className="text-nutreco-blue font-bold text-base">
              {session.account.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-nutreco-neutral truncate">{session.account.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
          </div>
        </div>
        <SyncStatusBadge status={session.syncStatus} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">SPIN</span>
          <div className="flex gap-1">
            {STAGES.map(({ key }) => (
              <span
                key={key}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  covered.has(key)
                    ? 'bg-nutreco-lime text-nutreco-neutral'
                    : 'bg-gray-100 text-gray-300'
                }`}
              >
                {key}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {coverCount > 0 && (
            <span className="text-xs text-gray-400">{coverCount}/4 stages</span>
          )}
          {session.syncStatus === 'error' && onRetrySync && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRetrySync(session.id)
              }}
              className="flex items-center justify-center text-xs text-nutreco-blue hover:underline font-semibold px-2 py-1 rounded-lg hover:bg-nutreco-blue/5 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </button>
  )
}
