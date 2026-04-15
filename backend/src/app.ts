import express from 'express'
import { corsMiddleware } from './middleware/cors.js'
import { authMiddleware } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import d365Router from './routes/d365.js'
import claudeRouter from './routes/claude.js'
import transcribeRouter from './routes/transcribe.js'

export function createApp() {
  const app = express()

  app.use(corsMiddleware)
  app.use(express.json({ limit: '10mb' }))

  // Health check — public, no auth required
  app.use('/api/health', healthRouter)

  // All other /api/* routes require a valid Azure AD JWT
  app.use('/api', authMiddleware)
  app.use('/api/d365', d365Router)
  app.use('/api/claude', claudeRouter)
  app.use('/api/transcribe', transcribeRouter)

  app.use(errorHandler)

  return app
}
