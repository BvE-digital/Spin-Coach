export const API_BASE = '/api'

export const ENDPOINTS = {
  health: `${API_BASE}/health`,
  d365Accounts: `${API_BASE}/d365/accounts`,
  d365Opportunities: `${API_BASE}/d365/opportunities`,
  d365Sync: `${API_BASE}/d365/sync`,
  claudeChat: `${API_BASE}/claude/chat`,
  claudeExtract: `${API_BASE}/claude/extract`,
  transcribe: `${API_BASE}/transcribe`,
  sessions: `${API_BASE}/sessions`,
} as const
