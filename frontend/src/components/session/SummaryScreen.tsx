import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { claudeService } from '../../services/claudeService'
import { syncService } from '../../services/syncService'
import { saveSession, getSession, updateSyncStatus } from '../../db/sessionDb'
import { useTTS } from '../../hooks/useTTS'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import type { SpinExtraction, ExtractedField } from '../../types/session'
import toast from 'react-hot-toast'

function confidenceClass(confidence: number): string {
  if (confidence >= 0.7) return ''
  return 'border-l-4 border-nutreco-orange bg-nutreco-orange/5'
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 0.7) return 'text-nutreco-teal'
  if (confidence >= 0.4) return 'text-nutreco-orange'
  return 'text-nutreco-red'
}

function EditableField<T extends string | number | null>({
  label,
  field,
  onUpdate,
}: {
  label: string
  field: ExtractedField<T>
  onUpdate: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(field.value !== null ? String(field.value) : '')

  return (
    <div className={`p-3 rounded-lg mb-2 ${confidenceClass(field.confidence)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className={`text-xs ${confidenceBadge(field.confidence)}`}>
          {field.confidence >= 0.7 ? 'High' : field.confidence >= 0.4 ? 'Medium' : 'Low'} confidence
        </span>
      </div>
      {editing ? (
        <input
          className="w-full text-sm text-nutreco-neutral border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-nutreco-blue"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            onUpdate(val)
            setEditing(false)
          }}
          autoFocus
        />
      ) : (
        <button
          className="text-sm text-nutreco-neutral text-left w-full hover:text-nutreco-blue transition-colors"
          onClick={() => setEditing(true)}
        >
          {val || <span className="text-gray-300 italic">Not captured — tap to add</span>}
        </button>
      )}
    </div>
  )
}

export function SummaryScreen() {
  const navigate = useNavigate()
  const store = useSessionStore()
  const { speak, cancel: cancelTTS } = useTTS()
  const isOnline = useOnlineStatus()
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [extraction, setExtraction] = useState<SpinExtraction | null>(store.extraction)

  // Build a plain-text transcript from messages
  function buildTranscript(): string {
    return store.messages
      .map((m) => `${m.role === 'user' ? 'Rep' : 'SPIN Coach'}: ${m.content}`)
      .join('\n\n')
  }

  // Extract data from Claude on mount if not already done
  useEffect(() => {
    if (extraction || store.messages.length === 0) return
    setIsExtracting(true)

    const sessionContext = {
      repName: 'Rep',
      customerName: store.selectedAccount?.name ?? '',
      visitDate: store.visitDate,
      opportunityMode: store.opportunityMode,
      existingOpportunityName: store.opportunityName ?? undefined,
    }

    claudeService
      .extractSpinData(buildTranscript(), sessionContext)
      .then((data) => {
        setExtraction(data)
        store.setExtraction(data)

        // Read summary aloud
        const summary = data.needPayoff.desiredOutcome?.value ?? ''
        if (summary) {
          speak(`Here's what I captured. ${summary}. Tap Submit to push to D365 or edit any fields first.`)
        }
      })
      .catch((err) => {
        console.error('Extraction failed:', err)
        toast.error('Could not extract session data')
      })
      .finally(() => setIsExtracting(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!store.sessionId || !store.selectedAccount || !extraction) return
    cancelTTS()
    setIsSyncing(true)

    try {
      // Build full session object
      const session = (await getSession(store.sessionId))!
      const finalSession = { ...session, extraction, syncStatus: 'pending_sync' as const }
      await saveSession(finalSession)

      if (isOnline) {
        const result = await syncService.sync(finalSession)
        if (result.success) {
          await updateSyncStatus(store.sessionId, 'synced', { d365Ids: result.d365Ids })
          toast.success('Synced to D365!')
        }
      } else {
        toast.success('Saved — will sync when back online')
      }

      store.resetSession()
      navigate('/history')
    } catch (err) {
      toast.error('Sync failed — saved locally for retry')
      await updateSyncStatus(store.sessionId!, 'error', {
        syncError: err instanceof Error ? err.message : String(err),
      })
      navigate('/history')
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleDiscard() {
    cancelTTS()
    if (store.sessionId) {
      await updateSyncStatus(store.sessionId, 'discarded')
    }
    store.resetSession()
    navigate('/session/setup')
  }

  if (isExtracting) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <Spinner size="lg" />
        <p className="text-nutreco-neutral text-lg font-medium">Analysing your debrief…</p>
        <p className="text-gray-400 text-sm text-center max-w-xs">
          SPIN Coach is extracting structured data from your conversation.
        </p>
      </div>
    )
  }

  if (!extraction) {
    return (
      <div className="text-center py-20">
        <p className="text-nutreco-neutral">No extraction data. Please complete a debrief first.</p>
        <Button className="mt-4" onClick={() => navigate('/session/setup')}>
          Start New Session
        </Button>
      </div>
    )
  }

  function updateField(path: string, val: string) {
    // Simple deep update for demonstration; production would use immer
    console.debug('Field updated:', path, val)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nutreco-blue mb-1">Session Summary</h1>
        <p className="text-nutreco-neutral text-sm">
          Review what was captured. Tap any field to edit. Fields highlighted in orange need attention.
        </p>
      </div>

      {/* Situation */}
      <Section title="Situation" stage="S">
        <EditableField label="Production System" field={extraction.situation.productionSystem} onUpdate={(v) => updateField('situation.productionSystem.value', v)} />
        <EditableField label="Herd / Flock Size" field={extraction.situation.herdSize} onUpdate={(v) => updateField('situation.herdSize.value', v)} />
        <EditableField label="Current Products" field={{ value: extraction.situation.currentProducts.value?.join(', ') ?? null, confidence: extraction.situation.currentProducts.confidence }} onUpdate={(v) => updateField('situation.currentProducts.value', v)} />
        <EditableField label="Additional Context" field={extraction.situation.additionalContext} onUpdate={(v) => updateField('situation.additionalContext.value', v)} />
      </Section>

      {/* Problem */}
      <Section title="Problem" stage="P">
        <EditableField label="Main Challenge" field={extraction.problem.mainChallenge} onUpdate={(v) => updateField('problem.mainChallenge.value', v)} />
        <EditableField label="Pain Points" field={{ value: extraction.problem.painPoints.value?.join('; ') ?? null, confidence: extraction.problem.painPoints.confidence }} onUpdate={(v) => updateField('problem.painPoints.value', v)} />
        <EditableField label="Supplier Issues" field={extraction.problem.currentSuppliersIssues} onUpdate={(v) => updateField('problem.currentSuppliersIssues.value', v)} />
      </Section>

      {/* Implication */}
      <Section title="Implication" stage="I">
        <EditableField label="Financial Impact" field={extraction.implication.financialImpact} onUpdate={(v) => updateField('implication.financialImpact.value', v)} />
        <EditableField label="Operational Impact" field={extraction.implication.operationalImpact} onUpdate={(v) => updateField('implication.operationalImpact.value', v)} />
        <EditableField label="Urgency" field={extraction.implication.urgency} onUpdate={(v) => updateField('implication.urgency.value', v)} />
      </Section>

      {/* Need-Payoff */}
      <Section title="Need-Payoff" stage="N">
        <EditableField label="Desired Outcome" field={extraction.needPayoff.desiredOutcome} onUpdate={(v) => updateField('needPayoff.desiredOutcome.value', v)} />
        <EditableField label="Perceived Value" field={extraction.needPayoff.perceivedValue} onUpdate={(v) => updateField('needPayoff.perceivedValue.value', v)} />
        <EditableField label="Decision Timeline" field={extraction.needPayoff.decisionTimeline} onUpdate={(v) => updateField('needPayoff.decisionTimeline.value', v)} />
        <EditableField label="Next Steps" field={{ value: extraction.needPayoff.nextSteps.value?.join('; ') ?? null, confidence: extraction.needPayoff.nextSteps.confidence }} onUpdate={(v) => updateField('needPayoff.nextSteps.value', v)} />
      </Section>

      {/* Opportunity */}
      <Section title="Opportunity" stage="">
        <EditableField label="Estimated Value" field={extraction.opportunity.estimatedValue} onUpdate={(v) => updateField('opportunity.estimatedValue.value', v)} />
        <EditableField label="Currency" field={extraction.opportunity.currency} onUpdate={(v) => updateField('opportunity.currency.value', v)} />
        <EditableField label="Expected Close Date" field={extraction.opportunity.closeDate} onUpdate={(v) => updateField('opportunity.closeDate.value', v)} />
      </Section>

      <div className="flex gap-3 pb-8">
        <Button variant="ghost" className="flex-1" onClick={() => void handleDiscard()}>
          Discard
        </Button>
        <Button
          className="flex-1"
          size="lg"
          onClick={() => void handleSubmit()}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Spinner size="sm" />
          ) : isOnline ? (
            'Submit to D365 →'
          ) : (
            'Save for Later →'
          )}
        </Button>
      </div>
    </div>
  )
}

function Section({
  title,
  stage,
  children,
}: {
  title: string
  stage: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 bg-nutreco-blue/5 border-b border-gray-100 flex items-center gap-3">
        {stage && (
          <span className="w-7 h-7 rounded-full bg-nutreco-blue text-white text-sm font-bold flex items-center justify-center">
            {stage}
          </span>
        )}
        <h2 className="font-semibold text-nutreco-neutral">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
