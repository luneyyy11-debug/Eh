export type Language = 'en' | 'ckb'
export type Currency = 'IQD' | 'USD'
export type Role = 'owner' | 'cashier'
export type UnitStatus = 'in_stock' | 'sold' | 'returned' | 'repair' | 'reserved' | 'written_off'
export type SaleStatus = 'completed' | 'returned' | 'reversed'
export type SyncStatus = 'local' | 'pending' | 'synced' | 'failed' | 'conflict'
export type Condition = 'new' | 'used' | 'refurbished'
export type PaymentMethod = 'cash' | 'bank' | 'other'
export type MovementType =
  | 'added'
  | 'sold'
  | 'returned'
  | 'repair'
  | 'reserved'
  | 'released'
  | 'written_off'
  | 'price_changed'
  | 'stock_adjusted'
  | 'sale_reversed'

export interface Settings {
  id: string
  shopName: string
  shopPhone: string
  shopAddress: string
  language: Language
  exchangeRate: number
  defaultCurrency: Currency
  receiptPrefix: string
  invoiceSeq: number
  deviceId: string
  lastSyncAt: string | null
  syncMode: 'local' | 'cloud'
  demoData: boolean
}

export interface User {
  id: string
  name: string
  role: Role
  pin: string
  active: boolean
}

export interface Brand {
  id: string
  name: string
  color: string
  sort: number
  active: boolean
}

export interface PhoneModel {
  id: string
  brandId: string
  name: string
  family?: string
  image: string
  specs?: string
  active: boolean
  createdAt: string
}

export interface Variant {
  id: string
  modelId: string
  ram: string
  storage: string
  colour: string
  region?: string
  active: boolean
}

export interface InventoryUnit {
  id: string
  shortId: string
  modelId: string
  brandId: string
  variantId?: string
  ram: string
  storage: string
  colour: string
  region: string
  network: string
  condition: Condition
  batteryHealth: number | null
  imei1: string
  imei2: string
  serial: string
  supplier: string
  dateReceived: string
  notes: string
  purchaseCost: number
  purchaseCurrency: Currency
  sellingPrice: number
  sellingCurrency: Currency
  exchangeRate: number
  barcode: string
  status: UnitStatus
  createdAt: string
  updatedAt: string
  syncStatus: SyncStatus
  createdBy: string
}

export interface Sale {
  id: string
  invoiceNo: string
  unitId: string
  barcode: string
  modelId: string
  modelName: string
  brandName: string
  image: string
  variantLabel: string
  imeiMasked: string
  staffId: string
  staffName: string
  customerName: string
  customerPhone: string
  currency: Currency
  salePrice: number
  discount: number
  total: number
  purchaseCostSnapshot: number
  purchaseCurrency: Currency
  exchangeRate: number
  paymentMethod: PaymentMethod
  note: string
  soldAt: string
  status: SaleStatus
  syncStatus: SyncStatus
  returnedAt?: string
  returnReason?: string
}

export interface StockMovement {
  id: string
  unitId: string
  type: MovementType
  fromStatus?: UnitStatus
  toStatus?: UnitStatus
  reason: string
  userId: string
  at: string
  meta?: Record<string, string | number | boolean | null>
}

export interface AuditLog {
  id: string
  entity: string
  entityId: string
  action: string
  oldValue: string
  newValue: string
  reason: string
  userId: string
  at: string
}

export interface SyncOperation {
  id: string
  opId: string
  action: string
  entity: string
  entityId: string
  payload: string
  status: SyncStatus
  createdAt: string
  result: string
}

export interface SessionUser {
  id: string
  name: string
  role: Role
}

export interface Session {
  user: SessionUser
  signedInAt: string
}

export interface UnitWithModel extends InventoryUnit {
  model?: PhoneModel
  brand?: Brand
}

export interface SaleWithUnit extends Sale {
  unit?: InventoryUnit
}
