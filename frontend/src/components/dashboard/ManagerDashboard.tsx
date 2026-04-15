import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { getAllSessions } from '../../db/sessionDb'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import type { Session, SpinStage } from '../../types/session'

const STAGES: SpinStage[] = ['S', 'P', 'I', 'N']

function spinCoverageScore(session: Session): number {
  if (!session.extraction) return 0
  const { situationScore, problemScore, implicationScore, needPayoffScore } =
    session.extraction.overallSpinCoverage
  const scores = [situationScore, problemScore, implicationScore, needPayoffScore]
  return Math.round((scores.filter((s) => s > 0.3).length / 4) * 100)
}

function completenessScore(session: Session): number {
  if (!session.extraction) return 0
  const fields = [
    session.extraction.situation.productionSystem,
    session.extraction.situation.herdSize,
    session.extraction.problem.mainChallenge,
    session.extraction.implication.urgency,
    session.extraction.needPayoff.desiredOutcome,
    session.extraction.needPayoff.nextSteps,
    session.extraction.opportunity.estimatedValue,
    session.extraction.opportunity.closeDate,
  ]
  const filled = fields.filter((f) => f.value !== null).length
  return Math.round((filled / fields.length) * 100)
}

function exportToCsv(rows: Session[]) {
  const headers = ['Rep', 'Customer', 'Visit Date', 'SPIN Coverage %', 'Completeness %', 'Status']
  const data = rows.map((s) => [
    s.repName,
    s.account.name,
    new Date(s.visitDate).toLocaleDateString('en-GB'),
    String(spinCoverageScore(s)),
    String(completenessScore(s)),
    s.syncStatus,
  ])
  const csv = [headers, ...data].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spin-coach-export-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ManagerDashboard() {
  const { accounts } = useMsal()
  const account = accounts[0]
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRep, setFilterRep] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Role check
  const roles = (account?.idTokenClaims as Record<string, unknown> | undefined)?.['roles']
  const isManager = Array.isArray(roles) && roles.includes('SpinCoach.Manager')

  useEffect(() => {
    getAllSessions()
      .then((all) => setSessions(all.filter((s) => s.syncStatus !== 'in_progress')))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (!isManager) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-nutreco-neutral mb-2">Access Restricted</h2>
        <p className="text-gray-400 text-sm">
          The manager dashboard requires the <code>SpinCoach.Manager</code> role.
        </p>
      </div>
    )
  }

  const reps = [...new Set(sessions.map((s) => s.repName))].sort()

  const filtered = sessions.filter((s) => {
    if (filterRep && s.repName !== filterRep) return false
    if (filterDateFrom && s.visitDate < filterDateFrom) return false
    if (filterDateTo && s.visitDate > filterDateTo + 'T23:59') return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-nutreco-blue">Manager Dashboard</h1>
        <Button size="sm" variant="secondary" onClick={() => exportToCsv(filtered)}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <select
          value={filterRep}
          onChange={(e) => setFilterRep(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-nutreco-blue"
        >
          <option value="">All Reps</option>
          {reps.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-nutreco-blue"
          placeholder="From"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-nutreco-blue"
          placeholder="To"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-nutreco-blue/5 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-nutreco-neutral">Rep</th>
                <th className="text-left px-4 py-3 font-semibold text-nutreco-neutral">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-nutreco-neutral">Date</th>
                <th className="text-center px-4 py-3 font-semibold text-nutreco-neutral">SPIN</th>
                <th className="text-right px-4 py-3 font-semibold text-nutreco-neutral">Complete</th>
                <th className="text-center px-4 py-3 font-semibold text-nutreco-neutral">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    No sessions match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((session) => (
                  <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-nutreco-neutral">{session.repName}</td>
                    <td className="px-4 py-3 text-nutreco-neutral">{session.account.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(session.visitDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {STAGES.map((s) => {
                          const score = session.extraction?.overallSpinCoverage
                          const covered =
                            (s === 'S' && (score?.situationScore ?? 0) > 0.3) ||
                            (s === 'P' && (score?.problemScore ?? 0) > 0.3) ||
                            (s === 'I' && (score?.implicationScore ?? 0) > 0.3) ||
                            (s === 'N' && (score?.needPayoffScore ?? 0) > 0.3)
                          return (
                            <span
                              key={s}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                covered
                                  ? 'bg-nutreco-lime text-nutreco-neutral'
                                  : 'bg-gray-100 text-gray-300'
                              }`}
                            >
                              {s}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span
                        className={`${
                          completenessScore(session) >= 70
                            ? 'text-nutreco-teal'
                            : completenessScore(session) >= 40
                            ? 'text-nutreco-orange'
                            : 'text-nutreco-red'
                        }`}
                      >
                        {completenessScore(session)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          session.syncStatus === 'synced'
                            ? 'bg-nutreco-teal/10 text-nutreco-teal'
                            : session.syncStatus === 'error'
                            ? 'bg-nutreco-red/10 text-nutreco-red'
                            : 'bg-nutreco-orange/10 text-nutreco-orange'
                        }`}
                      >
                        {session.syncStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
