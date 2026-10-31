import { db } from '../db/db'
import type { SyncOperation } from '../types'
import { uuid } from './id'

export function makeSyncOp(action: string, entity: string, entityId: string, payload: unknown, status: SyncOperation['status'] = 'local'): SyncOperation {
  return {
    id: uuid(),
    opId: uuid(),
    action,
    entity,
    entityId,
    payload: JSON.stringify(payload),
    status,
    createdAt: new Date().toISOString(),
    result: status === 'local' ? 'Stored on this device (local mode)' : ''
  }
}

export async function queueOperation(action: string, entity: string, entityId: string, payload: unknown): Promise<void> {
  await db.syncOps.put(makeSyncOp(action, entity, entityId, payload))
}

export interface SyncSummary {
  local: number
  pending: number
  failed: number
  conflict: number
  synced: number
  lastSyncAt: string | null
  mode: 'local' | 'cloud'
}

export async function syncSummary(): Promise<SyncSummary> {
  const [ops, settings] = await Promise.all([db.syncOps.toArray(), db.settings.get('shop')])
  const count = (status: SyncOperation['status']) => ops.filter((op) => op.status === status).length
  const latest = ops
    .filter((op) => op.status === 'synced')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return {
    local: count('local'),
    pending: count('pending'),
    failed: count('failed'),
    conflict: count('conflict'),
    synced: count('synced'),
    lastSyncAt: settings?.lastSyncAt ?? latest?.createdAt ?? null,
    mode: settings?.syncMode ?? 'local'
  }
}

export type SyncResult = { ok: true; synced: number } | { ok: false; reason: 'offline' | 'local_mode' | 'no_pending' }

/**
 * Local-first by design. Cloud sync is wired behind a flag for Stage 2; until a
 * Supabase project is configured, operations remain safely stored as local.
 */
export async function syncNow(): Promise<SyncResult> {
  const settings = await db.settings.get('shop')
  if (!settings || settings.syncMode === 'local') return { ok: false, reason: 'local_mode' }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { ok: false, reason: 'offline' }
  const pending = await db.syncOps.where('status').equals('pending').count()
  if (!pending) return { ok: false, reason: 'no_pending' }
  return { ok: false, reason: 'local_mode' }
}
