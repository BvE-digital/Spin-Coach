import type { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500
  const message = err.message ?? 'Internal Server Error'

  if (status === 401) {
    res.status(401).json({ error: 'Unauthorized', message })
    return
  }

  if (status === 403) {
    res.status(403).json({ error: 'Forbidden', message })
    return
  }

  console.error('[Error]', status, message, err.stack)
  res.status(status).json({ error: 'Server Error', message })
}
