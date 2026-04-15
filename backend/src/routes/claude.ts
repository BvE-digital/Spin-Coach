import { Router } from 'express'
import { claudeClient } from '../services/claudeClient.js'
import type { ChatMessage, SessionContext } from '../types/session.js'

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

    const result = await claudeClient.extractSpinData(transcript)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
