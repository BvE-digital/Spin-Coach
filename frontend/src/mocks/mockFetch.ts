/**
 * Client-side fetch interceptor for standalone demo mode.
 * Intercepts all /api/* calls and returns realistic mock data
 * so the app works as a single HTML file with no backend.
 */

const DEMO_ACCOUNTS = [
  { accountid: 'acc-001', name: 'Farmco Netherlands BV', telephone1: '+31 20 555 0101' },
  { accountid: 'acc-002', name: 'Trouw Poultry Farm', telephone1: '+31 30 555 0202' },
  { accountid: 'acc-003', name: 'Nordic Salmon AS', telephone1: '+47 22 555 0303' },
  { accountid: 'acc-004', name: 'AquaFeed Chile Ltda', telephone1: '+56 2 555 0404' },
  { accountid: 'acc-005', name: 'Skretting Demo Customer', telephone1: '+47 51 555 0505' },
  { accountid: 'acc-006', name: 'Nutreco Demo Farm', telephone1: '+31 33 555 0606' },
]

const DEMO_OPPORTUNITIES = [
  { opportunityid: 'opp-001', name: 'Q2 Feed Renewal 2026', statecode: 0 },
  { opportunityid: 'opp-002', name: 'New Aqua Product Trial', statecode: 0 },
]

const DEMO_SPIN_RESPONSES = [
  "Great, let's get started with the Situation. Tell me about the customer — what species do they produce and what was their current feed setup going into this visit?",
  "Understood. And what volume are they running roughly — do you have a sense of their monthly tonnage or herd size?",
  "Good context. Now let's move to the Problem stage. [STAGE:P] What challenges or frustrations did the customer bring up during the visit?",
  "That's useful. How long has this been an issue for them, and did they mention what they'd tried before to address it?",
  "Got it. Moving to Implication. [STAGE:I] What's the business cost of this problem — were there any numbers around lost production, extra cost, or compliance risk?",
  "Noted. Did they express any urgency — is there a deadline or external pressure driving them to act?",
  "Perfect. And for the final stage — [STAGE:N] what did the customer say success would look like? And what was the agreed next step coming out of the meeting?",
  "Excellent. I now have everything I need. Say 'done' or press End Session when you are ready.",
]

const DEMO_EXTRACTION = {
  situation: {
    herdSize: { value: 50000, confidence: 0.8 },
    productionSystem: { value: 'Broiler poultry, intensive indoor system', confidence: 0.9 },
    currentProducts: { value: ['CompetitorFeed Pro', 'Generic Premix X'], confidence: 0.7 },
    feedingRegime: { value: 'Ad libitum, 4-phase programme', confidence: 0.75 },
    additionalContext: { value: 'Two sites in the Netherlands, planning third site in 2027', confidence: 0.6 },
  },
  problem: {
    mainChallenge: { value: 'Feed conversion ratio above benchmark; flock uniformity poor in grower phase', confidence: 0.85 },
    painPoints: { value: ['High FCR vs industry average', 'Poor uniformity at day 21', 'Inconsistent pellet quality from current supplier'], confidence: 0.8 },
    currentSuppliersIssues: { value: 'Current supplier has had 3 delivery delays in Q1; quality inconsistent batch to batch', confidence: 0.75 },
  },
  implication: {
    financialImpact: { value: 'Estimated €80k/year in excess feed cost vs benchmark FCR', confidence: 0.65 },
    operationalImpact: { value: 'Extra culling and downgraded birds at slaughter; elevated vet bills', confidence: 0.7 },
    urgency: { value: 'high', confidence: 0.8 },
  },
  needPayoff: {
    desiredOutcome: { value: 'Achieve FCR of 1.65 or below and >95% uniformity by Q3 2026', confidence: 0.85 },
    perceivedValue: { value: '€120k annual saving plus improved integrator relationship', confidence: 0.6 },
    decisionTimeline: { value: 'Wants proposal by end of April; contract decision in May', confidence: 0.9 },
    nextSteps: { value: ['Send technical proposal with FCR trial data by 25 April', 'Arrange farm visit with nutritionist in first week of May'], confidence: 0.85 },
  },
  opportunity: {
    estimatedValue: { value: 120000, confidence: 0.6 },
    currency: { value: 'EUR', confidence: 0.95 },
    closeDate: { value: '2026-05-31', confidence: 0.8 },
  },
  overallSpinCoverage: {
    situationScore: 0.85,
    problemScore: 0.9,
    implicationScore: 0.75,
    needPayoffScore: 0.85,
  },
}

// Simulate SSE response as a ReadableStream
function makeSSEStream(messages: { role: string }[]): ReadableStream<Uint8Array> {
  const idx = Math.min(Math.floor(messages.length / 2), DEMO_SPIN_RESPONSES.length - 1)
  const response = DEMO_SPIN_RESPONSES[idx] ?? DEMO_SPIN_RESPONSES[DEMO_SPIN_RESPONSES.length - 1]
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      // Emit stage event if present
      const stageMatch = /\[STAGE:([SPIN])\]/.exec(response)
      if (stageMatch?.[1]) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'stage', stage: stageMatch[1] })}\n\n`
        ))
        await delay(50)
      }

      // Stream words one at a time
      const clean = response.replace(/\[STAGE:[SPIN]\]\s*/g, '')
      for (const word of clean.split(' ')) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ text: word + ' ' })}\n\n`
        ))
        await delay(45)
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

async function mockFetchHandler(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const path = url.replace(/^https?:\/\/[^/]+/, '')

  if (!path.startsWith('/api/')) return null // pass through non-api

  const method = init?.method?.toUpperCase() ?? 'GET'

  // Health
  if (path === '/api/health') {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() })
  }

  // D365 accounts search
  if (path.startsWith('/api/d365/accounts')) {
    const q = new URL(url, 'http://localhost').searchParams.get('q') ?? ''
    const matches = DEMO_ACCOUNTS.filter((a) =>
      a.name.toLowerCase().includes(q.toLowerCase())
    )
    return jsonResponse({ value: matches })
  }

  // D365 opportunities
  if (path.startsWith('/api/d365/opportunities')) {
    return jsonResponse({ value: DEMO_OPPORTUNITIES })
  }

  // D365 sync
  if (path === '/api/d365/sync' && method === 'POST') {
    await delay(800)
    return jsonResponse({
      success: true,
      d365Ids: {
        opportunityId: `demo-opp-${Date.now()}`,
        phoneCallId: `demo-call-${Date.now()}`,
        noteId: `demo-note-${Date.now()}`,
        taskIds: [`demo-task-${Date.now()}`],
      },
    })
  }

  // Claude chat (SSE)
  if (path === '/api/claude/chat' && method === 'POST') {
    const body = JSON.parse((init?.body as string) ?? '{}') as { messages?: { role: string }[] }
    const messages = body.messages ?? []
    return sseResponse(makeSSEStream(messages))
  }

  // Claude extract
  if (path === '/api/claude/extract' && method === 'POST') {
    await delay(1500)
    return jsonResponse(DEMO_EXTRACTION)
  }

  // Sessions list (manager dashboard)
  if (path === '/api/sessions') {
    return jsonResponse({ value: [] })
  }

  return jsonResponse({ error: 'Not found in mock' }, 404)
}

// Patch the global fetch to intercept /api/* calls in standalone mode
export function installMockFetch(): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const mocked = await mockFetchHandler(input, init)
    if (mocked !== null) return mocked
    return originalFetch(input, init)
  }
}
