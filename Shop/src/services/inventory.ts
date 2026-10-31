import { db } from '../db/db'
import { generateUniqueShortId } from './barcode'
import type {
  AuditLog,
  Condition,
  Currency,
  InventoryUnit,
  PaymentMethod,
  PhoneModel,
  Sale,
  SessionUser,
  StockMovement,
  UnitStatus
} from '../types'
import { uuid } from './id'
import { makeSyncOp } from './sync'

export class ShopError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ShopError'
  }
}

export interface AddUnitInput {
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
  shortId?: string
}

function audit(
  entity: string,
  entityId: string,
  action: string,
  oldValue: string,
  newValue: string,
  reason: string,
  userId: string
): AuditLog {
  return {
    id: uuid(),
    entity,
    entityId,
    action,
    oldValue,
    newValue,
    reason,
    userId,
    at: new Date().toISOString()
  }
}

async function validateIdentifiers(
  units: InventoryUnit[],
  imei1: string,
  imei2: string,
  serial: string,
  exceptId?: string
): Promise<void> {
  const one = imei1.trim()
  const two = imei2.trim()
  const sn = serial.trim()
  for (const unit of units) {
    if (unit.id === exceptId) continue
    if (one && (unit.imei1 === one || unit.imei2 === one)) throw new ShopError('duplicate_imei', 'This IMEI is already registered')
    if (two && (unit.imei1 === two || unit.imei2 === two)) throw new ShopError('duplicate_imei', 'This IMEI is already registered')
    if (sn && unit.serial === sn) throw new ShopError('duplicate_serial', 'This serial number is already registered')
  }
}

export async function addUnit(input: AddUnitInput, user: SessionUser): Promise<InventoryUnit> {
  const barcode = input.barcode.trim()
  if (!barcode) throw new ShopError('barcode_required', 'Barcode is required')
  if (input.sellingPrice <= 0) throw new ShopError('price_required', 'Selling price must be greater than zero')
  if (input.purchaseCost < 0) throw new ShopError('cost_invalid', 'Purchase cost cannot be negative')

  const unitId = uuid()
  const shortId = input.shortId?.trim().toUpperCase() || (await generateUniqueShortId())
  const now = new Date().toISOString()

  return db.transaction(
    'rw',
    [db.units, db.models, db.variants, db.movements, db.auditLogs, db.syncOps],
    async () => {
      const model = await db.models.get(input.modelId)
      if (!model) throw new ShopError('model_missing', 'Catalogue model was not found')

      const units = await db.units.toArray()
      if (units.some((u) => u.barcode === barcode)) throw new ShopError('duplicate_barcode', 'This barcode is already in use')
      if (units.some((u) => u.shortId === shortId)) throw new ShopError('duplicate_short_id', 'Short stock ID is already in use')
      await validateIdentifiers(units, input.imei1, input.imei2, input.serial)

      if (input.variantId) {
        const variant = await db.variants.get(input.variantId)
        if (!variant) throw new ShopError('variant_missing', 'Variant was not found')
      }

      const unit: InventoryUnit = {
        id: unitId,
        shortId,
        modelId: input.modelId,
        brandId: input.brandId,
        variantId: input.variantId,
        ram: input.ram.trim(),
        storage: input.storage.trim(),
        colour: input.colour.trim(),
        region: input.region.trim(),
        network: input.network.trim(),
        condition: input.condition,
        batteryHealth: input.batteryHealth,
        imei1: input.imei1.trim(),
        imei2: input.imei2.trim(),
        serial: input.serial.trim(),
        supplier: input.supplier.trim(),
        dateReceived: input.dateReceived,
        notes: input.notes.trim(),
        purchaseCost: Math.round(input.purchaseCost),
        purchaseCurrency: input.purchaseCurrency,
        sellingPrice: Math.round(input.sellingPrice),
        sellingCurrency: input.sellingCurrency,
        exchangeRate: input.exchangeRate,
        barcode,
        status: 'in_stock',
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
        createdBy: user.id
      }

      const movement: StockMovement = {
        id: uuid(),
        unitId,
        type: 'added',
        toStatus: 'in_stock',
        reason: '',
        userId: user.id,
        at: now
      }

      await db.units.put(unit)
      await db.movements.put(movement)
      await db.auditLogs.put(
        audit('unit', unitId, 'unit_added', '', `${model.name} · ${barcode}`, '', user.id)
      )
      await db.syncOps.put(makeSyncOp('unit.add', 'unit', unitId, unit))
      return unit
    }
  )
}

const allowedTransitions: Record<UnitStatus, UnitStatus[]> = {
  in_stock: ['repair', 'reserved', 'written_off'],
  repair: ['in_stock', 'written_off'],
  reserved: ['in_stock', 'written_off'],
  returned: ['in_stock', 'written_off'],
  sold: [],
  written_off: []
}

const transitionType: Record<string, StockMovement['type']> = {
  repair: 'repair',
  reserved: 'reserved',
  written_off: 'written_off',
  in_stock: 'released'
}

export async function changeUnitStatus(
  unitId: string,
  toStatus: UnitStatus,
  reason: string,
  user: SessionUser
): Promise<InventoryUnit> {
  if (user.role !== 'owner') throw new ShopError('forbidden', 'Only the owner can change stock status')
  if (!reason.trim()) throw new ShopError('reason_required', 'A reason is required')

  return db.transaction('rw', [db.units, db.movements, db.auditLogs, db.syncOps], async () => {
    const unit = await db.units.get(unitId)
    if (!unit) throw new ShopError('unit_missing', 'Phone not found')
    if (!allowedTransitions[unit.status].includes(toStatus)) {
      throw new ShopError('invalid_transition', `Cannot change status from ${unit.status} to ${toStatus}`)
    }
    const now = new Date().toISOString()
    const updated: InventoryUnit = { ...unit, status: toStatus, updatedAt: now, syncStatus: 'local' }
    await db.units.put(updated)
    await db.movements.put({
      id: uuid(),
      unitId,
      type: transitionType[toStatus] ?? 'stock_adjusted',
      fromStatus: unit.status,
      toStatus,
      reason: reason.trim(),
      userId: user.id,
      at: now
    })
    await db.auditLogs.put(
      audit('unit', unitId, 'status_changed', unit.status, toStatus, reason.trim(), user.id)
    )
    await db.syncOps.put(makeSyncOp('unit.status', 'unit', unitId, { status: toStatus, reason: reason.trim() }))
    return updated
  })
}

export async function updateSellingPrice(
  unitId: string,
  sellingPrice: number,
  sellingCurrency: Currency,
  reason: string,
  user: SessionUser
): Promise<InventoryUnit> {
  if (user.role !== 'owner') throw new ShopError('forbidden', 'Only the owner can edit prices')
  if (sellingPrice <= 0) throw new ShopError('price_required', 'Selling price must be greater than zero')

  return db.transaction('rw', [db.units, db.movements, db.auditLogs, db.syncOps], async () => {
    const unit = await db.units.get(unitId)
    if (!unit) throw new ShopError('unit_missing', 'Phone not found')
    if (unit.status === 'sold') throw new ShopError('unit_sold', 'Sold phones cannot be repriced')
    const now = new Date().toISOString()
    const oldValue = `${unit.sellingPrice} ${unit.sellingCurrency}`
    const updated: InventoryUnit = {
      ...unit,
      sellingPrice: Math.round(sellingPrice),
      sellingCurrency,
      updatedAt: now,
      syncStatus: 'local'
    }
    await db.units.put(updated)
    await db.movements.put({
      id: uuid(),
      unitId,
      type: 'price_changed',
      fromStatus: unit.status,
      toStatus: unit.status,
      reason: reason.trim(),
      userId: user.id,
      at: now,
      meta: { oldPrice: unit.sellingPrice, oldCurrency: unit.sellingCurrency, newPrice: sellingPrice, newCurrency: sellingCurrency }
    })
    await db.auditLogs.put(
      audit('unit', unitId, 'price_changed', oldValue, `${sellingPrice} ${sellingCurrency}`, reason.trim(), user.id)
    )
    await db.syncOps.put(makeSyncOp('unit.price', 'unit', unitId, { sellingPrice, sellingCurrency, reason }))
    return updated
  })
}

export interface SellInput {
  unitId: string
  salePrice: number
  discount: number
  currency: Currency
  exchangeRate: number
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  note: string
}

async function nextInvoiceNo(prefix: string, current: number, year: number): Promise<{ invoiceNo: string; seq: number }> {
  let seq = current + 1
  for (let i = 0; i < 10000; i++) {
    const invoiceNo = `${prefix || 'INV'}-${year}-${String(seq).padStart(4, '0')}`
    const clash = await db.sales.where('invoiceNo').equals(invoiceNo).first()
    if (!clash) return { invoiceNo, seq }
    seq += 1
  }
  throw new ShopError('invoice_failed', 'Could not create a unique receipt number')
}

export async function sellUnit(input: SellInput, user: SessionUser): Promise<Sale> {
  if (input.salePrice <= 0) throw new ShopError('price_required', 'Sale price must be greater than zero')
  if (input.discount < 0) throw new ShopError('discount_invalid', 'Discount cannot be negative')
  const total = input.salePrice - input.discount
  if (total <= 0) throw new ShopError('total_invalid', 'Discount cannot be equal to or greater than the price')

  return db.transaction(
    'rw',
    [db.units, db.models, db.brands, db.sales, db.settings, db.movements, db.auditLogs, db.syncOps],
    async () => {
      const unit = await db.units.get(input.unitId)
      if (!unit) throw new ShopError('unit_missing', 'Phone not found')
      if (unit.status !== 'in_stock') throw new ShopError('not_available', `This phone is ${unit.status.replace('_', ' ')} and cannot be sold`)
      const existing = await db.sales.where('unitId').equals(unit.id).filter((s) => s.status === 'completed').first()
      if (existing) throw new ShopError('already_sold', 'This phone already has a completed sale')

      const [model, brand, settings] = await Promise.all([
        db.models.get(unit.modelId),
        db.brands.get(unit.brandId),
        db.settings.get('shop')
      ])
      if (!settings) throw new ShopError('settings_missing', 'Shop settings are missing')

      const now = new Date()
      const { invoiceNo, seq } = await nextInvoiceNo(settings.receiptPrefix, settings.invoiceSeq, now.getFullYear())
      const imeiTail = unit.imei1 ? unit.imei1.slice(-4) : unit.shortId.slice(-4)

      const sale: Sale = {
        id: uuid(),
        invoiceNo,
        unitId: unit.id,
        barcode: unit.barcode,
        modelId: unit.modelId,
        modelName: model?.name ?? 'Unknown model',
        brandName: brand?.name ?? 'Unknown brand',
        image: model?.image ?? '/catalog/placeholder.svg',
        variantLabel: `${unit.ram} / ${unit.storage} · ${unit.colour}`,
        imeiMasked: `•••• ${imeiTail}`,
        staffId: user.id,
        staffName: user.name,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        currency: input.currency,
        salePrice: Math.round(input.salePrice),
        discount: Math.round(input.discount),
        total: Math.round(total),
        purchaseCostSnapshot: unit.purchaseCost,
        purchaseCurrency: unit.purchaseCurrency,
        exchangeRate: input.exchangeRate,
        paymentMethod: input.paymentMethod,
        note: input.note.trim(),
        soldAt: now.toISOString(),
        status: 'completed',
        syncStatus: 'local'
      }

      const updatedUnit: InventoryUnit = {
        ...unit,
        status: 'sold',
        updatedAt: sale.soldAt,
        syncStatus: 'local'
      }

      await db.sales.put(sale)
      await db.units.put(updatedUnit)
      await db.settings.put({ ...settings, invoiceSeq: seq })
      await db.movements.put({
        id: uuid(),
        unitId: unit.id,
        type: 'sold',
        fromStatus: 'in_stock',
        toStatus: 'sold',
        reason: invoiceNo,
        userId: user.id,
        at: sale.soldAt,
        meta: { invoiceNo, total: sale.total, currency: sale.currency }
      })
      await db.auditLogs.put(
        audit('sale', sale.id, 'sale_created', '', `${invoiceNo} · ${sale.modelName} · ${sale.total} ${sale.currency}`, '', user.id)
      )
      await db.syncOps.put(makeSyncOp('sale.create', 'sale', sale.id, sale))
      return sale
    }
  )
}

export async function returnSale(saleId: string, reason: string, user: SessionUser): Promise<Sale> {
  if (user.role !== 'owner') throw new ShopError('forbidden', 'Only the owner can process a return')
  if (!reason.trim()) throw new ShopError('reason_required', 'A reason is required')

  return db.transaction(
    'rw',
    [db.sales, db.units, db.movements, db.auditLogs, db.syncOps],
    async () => {
      const sale = await db.sales.get(saleId)
      if (!sale) throw new ShopError('sale_missing', 'Sale not found')
      if (sale.status !== 'completed') throw new ShopError('sale_not_completed', 'Only a completed sale can be returned')
      const unit = await db.units.get(sale.unitId)
      if (!unit) throw new ShopError('unit_missing', 'Phone record not found')

      const now = new Date().toISOString()
      const updatedSale: Sale = {
        ...sale,
        status: 'returned',
        returnedAt: now,
        returnReason: reason.trim(),
        syncStatus: 'local'
      }
      const updatedUnit: InventoryUnit = {
        ...unit,
        status: 'returned',
        updatedAt: now,
        syncStatus: 'local'
      }

      await db.sales.put(updatedSale)
      await db.units.put(updatedUnit)
      await db.movements.put({
        id: uuid(),
        unitId: unit.id,
        type: 'returned',
        fromStatus: 'sold',
        toStatus: 'returned',
        reason: reason.trim(),
        userId: user.id,
        at: now,
        meta: { invoiceNo: sale.invoiceNo }
      })
      await db.auditLogs.put(
        audit('sale', sale.id, 'sale_returned', 'completed', 'returned', reason.trim(), user.id)
      )
      await db.syncOps.put(makeSyncOp('sale.return', 'sale', sale.id, { saleId, reason: reason.trim() }))
      return updatedSale
    }
  )
}

export async function findModelForUnit(unit: InventoryUnit): Promise<PhoneModel | undefined> {
  return db.models.get(unit.modelId)
}
