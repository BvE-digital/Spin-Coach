import { openDB, type IDBPDatabase } from 'idb'
import type { SpinCoachDB } from './schema'
import type { Session, SyncStatus } from '../types/session'

let dbPromise: Promise<IDBPDatabase<SpinCoachDB>> | null = null

function getDb(): Promise<IDBPDatabase<SpinCoachDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SpinCoachDB>('spin-coach-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' })
        store.createIndex('by-repId', 'repId')
        store.createIndex('by-syncStatus', 'syncStatus')
        store.createIndex('by-createdAt', 'createdAt')
      },
    })
  }
  return dbPromise
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDb()
  await db.put('sessions', { ...session, updatedAt: new Date().toISOString() })
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDb()
  return db.get('sessions', id)
}

export async function getSessionsByRep(repId: string): Promise<Session[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('sessions', 'by-repId', repId)
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getPendingSessions(): Promise<Session[]> {
  const db = await getDb()
  return db.getAllFromIndex('sessions', 'by-syncStatus', 'pending_sync')
}

export async function updateSyncStatus(
  id: string,
  status: SyncStatus,
  extra?: Partial<Session>
): Promise<void> {
  const db = await getDb()
  const session = await db.get('sessions', id)
  if (!session) return
  await db.put('sessions', {
    ...session,
    ...extra,
    syncStatus: status,
    updatedAt: new Date().toISOString(),
  })
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDb()
  const all = await db.getAll('sessions')
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
