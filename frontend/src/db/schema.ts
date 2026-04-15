import type { DBSchema } from 'idb'
import type { Session, SyncStatus } from '../types/session'

export interface SpinCoachDB extends DBSchema {
  sessions: {
    key: string
    value: Session
    indexes: {
      'by-repId': string
      'by-syncStatus': SyncStatus
      'by-createdAt': string
    }
  }
}
