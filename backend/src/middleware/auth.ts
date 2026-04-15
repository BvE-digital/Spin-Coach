import { expressjwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import { env } from '../config/env.js'

export const authMiddleware = expressjwt({
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
