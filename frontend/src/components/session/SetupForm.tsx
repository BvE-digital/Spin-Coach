import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { CustomerSearch } from './CustomerSearch'
import { d365Service } from '../../services/d365Service'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { saveSession } from '../../db/sessionDb'
import { useMsal } from '@azure/msal-react'
import type { D365AccountResult, D365OpportunityResult } from '../../types/d365'

function nanoid() {
  return crypto.randomUUID()
}

export function SetupForm() {
  const navigate = useNavigate()
  const { accounts } = useMsal()
  const store = useSessionStore()
  const [opportunities, setOpportunities] = useState<D365OpportunityResult[]>([])
  const [loadingOpps, setLoadingOpps] = useState(false)

  // Load opportunities when an account is selected and mode is "existing"
  useEffect(() => {
    if (store.opportunityMode === 'existing' && store.selectedAccount?.accountid) {
      setLoadingOpps(true)
      d365Service
        .getOpportunities(store.selectedAccount.accountid)
        .then(setOpportunities)
        .catch(() => setOpportunities([]))
        .finally(() => setLoadingOpps(false))
    }
  }, [store.selectedAccount?.accountid, store.opportunityMode])

  function handleAccountSelect(account: D365AccountResult) {
    store.setAccount(account)
    store.setOpportunity('', '')
  }

  async function handleStart() {
    const account = accounts[0]
    const sessionId = nanoid()
    store.setSessionId(sessionId)
    store.resetSession()
    store.setSessionId(sessionId)

    // Create the in-progress session in IndexedDB immediately
    await saveSession({
      id: sessionId,
      repId: account?.localAccountId ?? 'unknown',
      repName: account?.name ?? 'Unknown',
      account: store.selectedAccount!,
      visitDate: store.visitDate,
      opportunityMode: store.opportunityMode,
      opportunityId: store.opportunityId ?? undefined,
      messages: [],
      syncStatus: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    navigate('/session/debrief')
  }

  const canStart = !!store.selectedAccount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nutreco-blue mb-1">New Debrief Session</h1>
        <p className="text-nutreco-neutral text-sm">
          Confirm the visit details before we start the SPIN debrief.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
        {/* Customer search */}
        <div>
          <label className="block text-sm font-semibold text-nutreco-neutral mb-2">
            Customer Account *
          </label>
          <CustomerSearch
            value={store.selectedAccount?.name ?? ''}
            onSelect={handleAccountSelect}
          />
        </div>

        {/* Visit date/time */}
        <div>
          <label className="block text-sm font-semibold text-nutreco-neutral mb-2">
            Visit Date & Time
          </label>
          <input
            type="datetime-local"
            value={store.visitDate}
            onChange={(e) => store.setVisitDate(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-nutreco-blue transition-colors"
          />
        </div>

        {/* Opportunity mode */}
        <div>
          <label className="block text-sm font-semibold text-nutreco-neutral mb-2">
            Opportunity
          </label>
          <div className="flex gap-3">
            {(['new', 'existing'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => store.setOpportunityMode(mode)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                  store.opportunityMode === mode
                    ? 'bg-nutreco-blue text-white border-nutreco-blue'
                    : 'bg-white text-nutreco-neutral border-gray-200 hover:border-nutreco-blue/50'
                }`}
              >
                {mode === 'new' ? 'New Opportunity' : 'Update Existing'}
              </button>
            ))}
          </div>
        </div>

        {/* Existing opportunity dropdown */}
        {store.opportunityMode === 'existing' && (
          <div>
            <label className="block text-sm font-semibold text-nutreco-neutral mb-2">
              Select Opportunity
            </label>
            {loadingOpps ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <select
                value={store.opportunityId ?? ''}
                onChange={(e) => {
                  const opp = opportunities.find((o) => o.opportunityid === e.target.value)
                  if (opp) store.setOpportunity(opp.opportunityid, opp.name)
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-nutreco-blue transition-colors bg-white"
              >
                <option value="">— Select an opportunity —</option>
                {opportunities.map((opp) => (
                  <option key={opp.opportunityid} value={opp.opportunityid}>
                    {opp.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => void handleStart()}
        disabled={!canStart}
      >
        Start Debrief Session →
      </Button>
    </div>
  )
}
