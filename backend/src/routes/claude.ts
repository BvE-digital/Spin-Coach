import { Router } from 'express'
import { claudeClient } from '../services/claudeClient.js'
import { env } from '../config/env.js'
import type { ChatMessage, SessionContext } from '../types/session.js'

// Demo SPIN conversation responses keyed by message count
const DEMO_CHAT_RESPONSES = [
  "Great, let's get started. Tell me about the customer — what species do they produce and what was their current feed setup going into this visit?",
  "Understood. And what volume are they running roughly — do you have a sense of their monthly tonnage or herd size?",
  "Good context. Now let's move to the Problem stage. [STAGE:P] What challenges or frustrations did the customer bring up during the visit?",
  "That's useful. How long has this been an issue for them, and did they mention what they'd tried before to address it?",
  "Got it. Moving to Implication. [STAGE:I] What's the business cost of this problem for them — were there any numbers around lost production, extra cost, or compliance risk?",
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
    operationalImpact: { value: 'Extra culling and downgraded birds at slaughter; vet bills elevated', confidence: 0.7 },
    urgency: { value: 'high', confidence: 0.8 },
  },
  needPayoff: {
    desiredOutcome: { value: 'Achieve FCR of 1.65 or below and >95% uniformity by Q3 2026', confidence: 0.85 },
    perceivedValue: { value: '€120k annual saving plus improved relationship with integrator', confidence: 0.6 },
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

const router = Router()

// POST /api/claude/chat — SSE streaming debrief conversation
router.post('/chat', async (req, res, next) => {
  try {
    const { messages, sessionContext } = req.body as {
      messages: ChatMessage[]
      sessionContext: SessionContext
    }

    if (!Array.isArray(messages) || !sessionContext) {
      res.status(400).json({ error: 'messages and sessionContext are required' })
      return
    }

    // Set SSE headers BEFORE any await that could throw
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable Nginx response buffering
    res.flushHeaders()

    if (env.DEMO_MODE) {
      // Stream a canned demo response word-by-word with a small delay
      const idx = Math.min(Math.floor(messages.length / 2), DEMO_CHAT_RESPONSES.length - 1)
      const response = DEMO_CHAT_RESPONSES[idx] ?? DEMO_CHAT_RESPONSES[DEMO_CHAT_RESPONSES.length - 1]
      const stageMatch = /\[STAGE:([SPIN])\]/.exec(response)
      if (stageMatch?.[1]) {
        res.write(`data: ${JSON.stringify({ type: 'stage', stage: stageMatch[1] })}\n\n`)
      }
      const cleanResponse = response.replace(/\[STAGE:[SPIN]\]\s*/g, '')
      for (const word of cleanResponse.split(' ')) {
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`)
        await new Promise((r) => setTimeout(r, 40))
      }
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const stream = claudeClient.streamChat(messages, sessionContext)
    let currentStage = 'S'

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text

        // Detect stage transition markers from the prompt ([STAGE:P], etc.)
        const stageMatch = /\[STAGE:([SPIN])\]/.exec(text)
        if (stageMatch?.[1] && stageMatch[1] !== currentStage) {
          currentStage = stageMatch[1]
          res.write(`data: ${JSON.stringify({ type: 'stage', stage: currentStage })}\n\n`)
        }

        // Strip the stage marker from the visible text
        const cleanText = text.replace(/\[STAGE:[SPIN]\]\s*/g, '')
        if (cleanText) {
          res.write(`data: ${JSON.stringify({ text: cleanText })}\n\n`)
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    // If headers already sent, we can't use the error handler normally
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
      res.end()
    } else {
      next(err)
    }
  }
})

// POST /api/claude/extract — non-streaming SPIN data extraction
router.post('/extract', async (req, res, next) => {
  try {
    const { transcript } = req.body as {
      transcript: string
      sessionContext?: SessionContext
    }

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'transcript string is required' })
      return
    }

    if (env.DEMO_MODE) {
      // Simulate extraction latency then return canned data
      await new Promise((r) => setTimeout(r, 1500))
      res.json(DEMO_EXTRACTION)
      return
    }

    const result = await claudeClient.extractSpinData(transcript)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
