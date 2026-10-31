import Dexie, { type Table } from 'dexie'
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

export class ShopDB extends Dexie {
  settings!: Table<Settings, string>
  users!: Table<User, string>
  brands!: Table<Brand, string>
  models!: Table<PhoneModel, string>
  variants!: Table<Variant, string>
  units!: Table<InventoryUnit, string>
  sales!: Table<Sale, string>
  movements!: Table<StockMovement, string>
  auditLogs!: Table<AuditLog, string>
  syncOps!: Table<SyncOperation, string>

  constructor(name = 'dukan-phone-db') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      users: 'id, role, active',
      brands: 'id, name, sort, active',
      models: 'id, brandId, name, family, active',
      variants: 'id, modelId, active',
      units: 'id, &barcode, shortId, modelId, brandId, variantId, status, imei1, serial, createdAt, syncStatus',
      sales: 'id, &invoiceNo, unitId, barcode, modelId, soldAt, status, currency, syncStatus',
      movements: 'id, unitId, at, type',
      auditLogs: 'id, entity, entityId, at',
      syncOps: 'id, opId, action, status, createdAt'
    })
  }
}

export const db = new ShopDB()
