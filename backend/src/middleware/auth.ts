import type { Request, Response, NextFunction } from 'express'
import { expressjwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import { env } from '../config/env.js'

const jwtMiddleware = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  }),
  audience: env.AZURE_CLIENT_ID,
  issuer: [
    `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
    `https://sts.windows.net/${env.AZURE_TENANT_ID}/`,
  ],
  algorithms: ['RS256'],
})

// In demo mode, skip JWT validation and inject a mock user
function demoAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  ;(req as Request & { auth?: unknown }).auth = {
    oid: 'demo-user-id',
    name: 'Demo Rep',
    preferred_username: 'demo@nutreco.com',
  }
  next()
}

export const authMiddleware = env.DEMO_MODE ? demoAuthMiddleware : jwtMiddleware
