import { db } from '../db/db'
import type {
  AuditLog,
  Brand,
  InventoryUnit,
  PhoneModel,
  Sale,
  Settings,
  StockMovement,
  SyncOperation,
  User,
  Variant
} from '../types'

const APP_ID = 'dukan-phone-backup'
const VERSION = 1

export interface BackupFile {
  app: string
  version: number
  exportedAt: string
  settings: Settings
  users: User[]
  brands: Brand[]
  models: PhoneModel[]
  variants: Variant[]
  units: InventoryUnit[]
  sales: Sale[]
  movements: StockMovement[]
  auditLogs: AuditLog[]
  syncOps: SyncOperation[]
}

export async function buildBackup(): Promise<BackupFile> {
  const [settings, users, brands, models, variants, units, sales, movements, auditLogs, syncOps] = await Promise.all([
    db.settings.get('shop'),
    db.users.toArray(),
    db.brands.toArray(),
    db.models.toArray(),
    db.variants.toArray(),
    db.units.toArray(),
    db.sales.toArray(),
    db.movements.toArray(),
    db.auditLogs.toArray(),
    db.syncOps.toArray()
  ])
  if (!settings) throw new Error('Shop settings are missing')
  return {
    app: APP_ID,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    users,
    brands,
    models,
    variants,
    units,
    sales,
    movements,
    auditLogs,
    syncOps
  }
}

function assertBackup(data: unknown): asserts data is BackupFile {
  if (!data || typeof data !== 'object') throw new Error('Backup file is not valid JSON')
  const candidate = data as Partial<BackupFile>
  if (candidate.app !== APP_ID) throw new Error('This file is not a Dukan Phone backup')
  if (!candidate.settings || !Array.isArray(candidate.units) || !Array.isArray(candidate.sales)) {
    throw new Error('Backup is missing shop settings, stock, or sales data')
  }
  if (!Array.isArray(candidate.brands) || !Array.isArray(candidate.models)) {
    throw new Error('Backup is missing catalogue data')
  }
}

export interface RestoreSummary {
  units: number
  sales: number
  models: number
}

export async function restoreBackup(text: string): Promise<RestoreSummary> {
  const parsed: unknown = JSON.parse(text)
  assertBackup(parsed)

  const current = await db.settings.get('shop')
  const settings: Settings = {
    ...parsed.settings,
    id: 'shop',
    deviceId: current?.deviceId ?? parsed.settings.deviceId,
    syncMode: current?.syncMode ?? parsed.settings.syncMode
  }

  const users = Array.isArray(parsed.users) && parsed.users.length ? parsed.users : []
  const variants = Array.isArray(parsed.variants) ? parsed.variants : []
  const movements = Array.isArray(parsed.movements) ? parsed.movements : []
  const auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : []
  const syncOps = Array.isArray(parsed.syncOps) ? parsed.syncOps : []

  await db.transaction(
    'rw',
    [
      db.settings,
      db.users,
      db.brands,
      db.models,
      db.variants,
      db.units,
      db.sales,
      db.movements,
      db.auditLogs,
      db.syncOps
    ],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.brands.clear(),
        db.models.clear(),
        db.variants.clear(),
        db.units.clear(),
        db.sales.clear(),
        db.movements.clear(),
        db.auditLogs.clear()
      ])
      await db.settings.put(settings)
      if (users.length) await db.users.bulkPut(users)
      await db.brands.bulkPut(parsed.brands)
      await db.models.bulkPut(parsed.models)
      if (variants.length) await db.variants.bulkPut(variants)
      await db.units.bulkPut(parsed.units)
      await db.sales.bulkPut(parsed.sales)
      if (movements.length) await db.movements.bulkPut(movements)
      if (auditLogs.length) await db.auditLogs.bulkPut(auditLogs)
      if (syncOps.length) await db.syncOps.bulkPut(syncOps)
    }
  )

  return { units: parsed.units.length, sales: parsed.sales.length, models: parsed.models.length }
}
