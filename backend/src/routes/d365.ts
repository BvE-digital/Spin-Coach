import { Router } from 'express'
import { d365Client } from '../services/d365Client.js'
import type { D365SyncPayload } from '../types/session.js'

const router = Router()

// GET /api/d365/accounts?q={searchTerm}
router.get('/accounts', async (req, res, next) => {
  try {
    const q = String(req.query['q'] ?? '').trim()
    if (q.length < 2) {
      res.json({ value: [] })
      return
    }
    const accounts = await d365Client.searchAccounts(q)
    res.json({ value: accounts })
  } catch (err) {
    next(err)
  }
})

// GET /api/d365/opportunities?accountId={id}
router.get('/opportunities', async (req, res, next) => {
  try {
    const accountId = String(req.query['accountId'] ?? '').trim()
    if (!accountId) {
      res.json({ value: [] })
      return
    }
    const opportunities = await d365Client.getOpportunitiesByAccount(accountId)
    res.json({ value: opportunities })
  } catch (err) {
    next(err)
  }
})

// POST /api/d365/sync
router.post('/sync', async (req, res, next) => {
  try {
    const { session } = req.body as D365SyncPayload
    if (!session || !session.account) {
      res.status(400).json({ error: 'session.account is required' })
      return
    }

    const ext = session.extraction
    const d365Ids: Record<string, unknown> = {}

    // 1. Create or update Opportunity
    const opportunityPayload: Record<string, unknown> = {
      name: `${session.account.name} — ${new Date(session.visitDate).toLocaleDateString('en-GB')}`,
      description: ext?.needPayoff.desiredOutcome?.value,
      estimatedvalue: ext?.opportunity.estimatedValue?.value,
      estimatedclosedate: ext?.opportunity.closeDate?.value,
      'customerid_account@odata.bind': `/accounts(${session.account.accountid})`,
    }

    if (session.opportunityMode === 'existing' && session.opportunityId) {
      await d365Client.updateOpportunity(session.opportunityId, opportunityPayload)
      d365Ids['opportunityId'] = session.opportunityId
    } else {
      const opp = await d365Client.createOpportunity(opportunityPayload)
      d365Ids['opportunityId'] = opp.opportunityid
    }

    // 2. Create PhoneCall activity linked to Opportunity
    const transcript = session.messages
      .map((m) => `${m.role === 'user' ? 'Rep' : 'SPIN Coach'}: ${m.content}`)
      .join('\n\n')

    const phoneCallPayload: Record<string, unknown> = {
      subject: `SPIN Debrief — ${session.account.name}`,
      description: transcript.slice(0, 4000), // D365 field limit
      actualstart: session.visitDate,
      actualend: session.visitDate,
      directioncode: true,
      'regardingobjectid_opportunity_phonecall@odata.bind':
        `/opportunities(${d365Ids['opportunityId']})`,
    }
    const call = await d365Client.createPhoneCallActivity(phoneCallPayload)
    d365Ids['phoneCallId'] = call.activityid

    // 3. Create Note with full extraction JSON
    const notePayload: Record<string, unknown> = {
      subject: 'SPIN Coach Session Summary',
      notetext: ext ? JSON.stringify(ext, null, 2) : transcript,
      'objectid_opportunity@odata.bind': `/opportunities(${d365Ids['opportunityId']})`,
    }
    const note = await d365Client.createNote(notePayload)
    d365Ids['noteId'] = note.annotationid

    // 4. Create Tasks for each next step
    const nextSteps = ext?.needPayoff.nextSteps?.value ?? []
    const taskIds: string[] = []
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    for (const step of nextSteps) {
      const taskPayload: Record<string, unknown> = {
        subject: step,
        scheduledend: dueDate.toISOString(),
        'regardingobjectid_opportunity_task@odata.bind':
          `/opportunities(${d365Ids['opportunityId']})`,
      }
      const task = await d365Client.createTask(taskPayload)
      taskIds.push(task.activityid)
    }
    d365Ids['taskIds'] = taskIds

    res.json({ success: true, d365Ids })
  } catch (err) {
    next(err)
  }
})

export default router
