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
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-nutreco-blue leading-tight">New Debrief Session</h1>
        <p className="text-nutreco-neutral text-sm mt-1">
          Fill in the visit details to start your SPIN debrief.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">

        {/* Customer */}
        <div className="p-5">
          <label className="block text-xs font-bold text-nutreco-blue uppercase tracking-widest mb-2">
            Customer Account <span className="text-nutreco-magenta">*</span>
          </label>
          <CustomerSearch
            value={store.selectedAccount?.name ?? ''}
            onSelect={handleAccountSelect}
          />
          {store.selectedAccount && (
            <p className="mt-2 text-xs text-nutreco-teal font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {store.selectedAccount.name}
            </p>
          )}
        </div>

        {/* Visit date */}
        <div className="p-5">
          <label className="block text-xs font-bold text-nutreco-blue uppercase tracking-widest mb-2">
            Visit Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={store.visitDate}
            onChange={(e) => store.setVisitDate(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-nutreco-blue transition-colors bg-gray-50"
          />
        </div>

        {/* Opportunity type */}
        <div className="p-5">
          <label className="block text-xs font-bold text-nutreco-blue uppercase tracking-widest mb-3">
            Opportunity Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['new', 'existing'] as const).map((mode) => {
              const isSelected = store.opportunityMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => store.setOpportunityMode(mode)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                    isSelected
                      ? 'bg-nutreco-blue text-white border-nutreco-blue shadow-md shadow-nutreco-blue/20'
                      : 'bg-white text-nutreco-neutral border-gray-200 hover:border-nutreco-blue/40 hover:bg-blue-50'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {mode === 'new' ? 'New Opportunity' : 'Update Existing'}
                </button>
              )
            })}
          </div>

          {/* Existing opportunity dropdown */}
          {store.opportunityMode === 'existing' && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-nutreco-neutral mb-2">
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
      </div>

      {/* CTA */}
      {!canStart && (
        <p className="text-center text-sm text-gray-400">
          Search and select a customer account above to continue
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleStart()}
        disabled={!canStart}
        className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-base font-bold transition-all shadow-lg ${
          canStart
            ? 'bg-nutreco-blue text-white hover:bg-blue-900 shadow-nutreco-blue/30 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
        Start Debrief Session
      </button>
    </div>
  )
}
