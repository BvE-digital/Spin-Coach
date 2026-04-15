import cors from 'cors'
import { env } from '../config/env.js'

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin, mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
})
