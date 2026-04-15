import type { SpinStage } from '../../types/session'

const STAGES: { key: SpinStage; label: string; full: string }[] = [
  { key: 'S', label: 'S', full: 'Situation' },
  { key: 'P', label: 'P', full: 'Problem' },
  { key: 'I', label: 'I', full: 'Implication' },
  { key: 'N', label: 'N', full: 'Need-Payoff' },
]

interface Props {
  current: SpinStage
  completed: SpinStage[]
}

export function SpinIndicator({ current, completed }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STAGES.map(({ key, label, full }, idx) => {
        const isCompleted = completed.includes(key)
        const isCurrent = current === key
        return (
          <div key={key} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-nutreco-blue text-white shadow-md scale-110'
                    : isCompleted
                    ? 'bg-nutreco-lime text-nutreco-neutral'
                    : 'bg-gray-200 text-gray-400'
                }`}
                aria-label={`${full} stage${isCurrent ? ' (current)' : isCompleted ? ' (complete)' : ''}`}
              >
                {label}
              </div>
              <span className="text-xs text-gray-400 hidden sm:block">{full}</span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`h-0.5 w-6 rounded transition-colors ${
                  isCompleted ? 'bg-nutreco-lime' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
