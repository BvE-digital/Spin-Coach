import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

// In DEMO_MODE all Azure/D365/AI credentials are optional.
// The backend starts, auth is bypassed, and D365 routes return mock data.
const DEMO_MODE = process.env['DEMO_MODE'] === 'true' ||
  (!process.env['AZURE_TENANT_ID'] && !process.env['ANTHROPIC_API_KEY'])

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEMO_MODE: z.string().optional(),

  // Azure AD — JWT validation (optional in demo mode)
  AZURE_TENANT_ID: z.string().default('demo-tenant'),
  AZURE_CLIENT_ID: z.string().default('demo-client'),
  AZURE_CLIENT_SECRET: z.string().default('demo-secret'),

  // D365
  D365_RESOURCE: z.string().default('https://demo.crm.dynamics.com'),
  D365_API_VERSION: z.string().default('9.2'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  // Transcription (Whisper fallback)
  OPENAI_API_KEY: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌  Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = { ...parsed.data, DEMO_MODE }

if (DEMO_MODE) {
  console.warn('⚠️   Running in DEMO MODE — auth bypassed, D365/AI calls return mock data')
  console.warn('    Set AZURE_TENANT_ID + ANTHROPIC_API_KEY in backend/.env for full functionality')
}
