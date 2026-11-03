import { db } from './db'
import { seedBrands, seedModels, seedVariants } from '../data/catalog'
import type {
  AuditLog,
  Brand,
  InventoryUnit,
  MovementType,
  PhoneModel,
  Sale,
  Settings,
  StockMovement,
  UnitStatus,
  User,
  Variant
} from '../types'

const DEFAULT_RATE = 1310

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function deviceId(): string {
  const key = 'dukan-device-id'
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const next = `dev-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    localStorage.setItem(key, next)
    return next
  } catch {
    return `dev-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }
}

function atDaysAgo(days: number, hour = 11, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const defaultSettings = (): Settings => ({
  id: 'shop',
  shopName: 'Dukan Phone',
  shopPhone: '+964 750 000 0000',
  shopAddress: 'Erbil, Kurdistan Region, Iraq',
  language: 'en',
  exchangeRate: DEFAULT_RATE,
  defaultCurrency: 'IQD',
  receiptPrefix: 'INV',
  invoiceSeq: 0,
  deviceId: deviceId(),
  lastSyncAt: null,
  syncMode: 'local',
  demoData: true
})

export const defaultUsers: User[] = [
  { id: 'owner', name: 'Shop Owner', role: 'owner', pin: '1234', active: true },
  { id: 'cashier', name: 'Cashier', role: 'cashier', pin: '1234', active: true }
]

interface DemoUnitInput {
  id: string
  shortId: string
  barcode: string
  modelId: string
  brandId: string
  variantId: string
  ram: string
  storage: string
  colour: string
  condition: InventoryUnit['condition']
  batteryHealth: number | null
  imei1?: string
  imei2?: string
  serial?: string
  purchaseCost: number
  purchaseCurrency: InventoryUnit['purchaseCurrency']
  sellingPrice: number
  sellingCurrency: InventoryUnit['sellingCurrency']
  status: UnitStatus
  createdAt: string
  notes?: string
}

const demoUnitInputs: DemoUnitInput[] = [
  {
    id: 'u-demo-01',
    shortId: 'DM1001',
    barcode: 'SHP-DM-1001',
    modelId: 'iphone-15-pro-max',
    brandId: 'apple',
    variantId: 'v-15pm-256-natural',
    ram: '8 GB',
    storage: '256 GB',
    colour: 'Natural Titanium',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1001',
    purchaseCost: 115000,
    purchaseCurrency: 'USD',
    sellingPrice: 129900,
    sellingCurrency: 'USD',
    status: 'in_stock',
    createdAt: atDaysAgo(12)
  },
  {
    id: 'u-demo-02',
    shortId: 'DM1002',
    barcode: 'SHP-DM-1002',
    modelId: 'iphone-15',
    brandId: 'apple',
    variantId: 'v-15-128-blue',
    ram: '6 GB',
    storage: '128 GB',
    colour: 'Blue',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1002',
    purchaseCost: 78000,
    purchaseCurrency: 'USD',
    sellingPrice: 89900,
    sellingCurrency: 'USD',
    status: 'in_stock',
    createdAt: atDaysAgo(9)
  },
  {
    id: 'u-demo-03',
    shortId: 'DM1003',
    barcode: 'SHP-DM-1003',
    modelId: 'galaxy-s24-ultra',
    brandId: 'samsung',
    variantId: 'v-s24u-256-gray',
    ram: '12 GB',
    storage: '256 GB',
    colour: 'Titanium Gray',
    condition: 'new',
    batteryHealth: null,
    imei1: '356000000000011',
    imei2: '356000000000012',
    purchaseCost: 1050000,
    purchaseCurrency: 'IQD',
    sellingPrice: 1250000,
    sellingCurrency: 'IQD',
    status: 'in_stock',
    createdAt: atDaysAgo(20)
  },
  {
    id: 'u-demo-04',
    shortId: 'DM1004',
    barcode: 'SHP-DM-1004',
    modelId: 'galaxy-a55',
    brandId: 'samsung',
    variantId: 'v-a55-256-navy',
    ram: '8 GB',
    storage: '256 GB',
    colour: 'Awesome Navy',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1004',
    purchaseCost: 330000,
    purchaseCurrency: 'IQD',
    sellingPrice: 415000,
    sellingCurrency: 'IQD',
    status: 'in_stock',
    createdAt: atDaysAgo(7)
  },
  {
    id: 'u-demo-05',
    shortId: 'DM1005',
    barcode: 'SHP-DM-1005',
    modelId: 'redmi-note-13-pro',
    brandId: 'xiaomi',
    variantId: 'v-rn13p-256-black',
    ram: '8 GB',
    storage: '256 GB',
    colour: 'Midnight Black',
    condition: 'used',
    batteryHealth: 94,
    imei1: '356000000000021',
    serial: 'DM-SN-1005',
    purchaseCost: 260000,
    purchaseCurrency: 'IQD',
    sellingPrice: 340000,
    sellingCurrency: 'IQD',
    status: 'in_stock',
    createdAt: atDaysAgo(4)
  },
  {
    id: 'u-demo-06',
    shortId: 'DM1006',
    barcode: 'SHP-DM-1006',
    modelId: 'poco-x6-pro',
    brandId: 'poco',
    variantId: 'v-px6p-512-yellow',
    ram: '12 GB',
    storage: '512 GB',
    colour: 'Yellow',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1006',
    purchaseCost: 380000,
    purchaseCurrency: 'IQD',
    sellingPrice: 470000,
    sellingCurrency: 'IQD',
    status: 'in_stock',
    createdAt: atDaysAgo(2)
  },
  {
    id: 'u-demo-07',
    shortId: 'DM1007',
    barcode: 'SHP-DM-1007',
    modelId: 'infinix-note-40',
    brandId: 'infinix',
    variantId: 'v-in40-256-black',
    ram: '8 GB',
    storage: '256 GB',
    colour: 'Obsidian Black',
    condition: 'new',
    batteryHealth: null,
    purchaseCost: 240000,
    purchaseCurrency: 'IQD',
    sellingPrice: 310000,
    sellingCurrency: 'IQD',
    status: 'repair',
    createdAt: atDaysAgo(15),
    notes: 'Screen issue — sent to repair.'
  },
  {
    id: 'u-demo-08',
    shortId: 'DM1008',
    barcode: 'SHP-DM-1008',
    modelId: 'galaxy-s24',
    brandId: 'samsung',
    variantId: 'v-s24-128-onyx',
    ram: '8 GB',
    storage: '128 GB',
    colour: 'Onyx Black',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1008',
    purchaseCost: 80000,
    purchaseCurrency: 'USD',
    sellingPrice: 94900,
    sellingCurrency: 'USD',
    status: 'sold',
    createdAt: atDaysAgo(10)
  },
  {
    id: 'u-demo-09',
    shortId: 'DM1009',
    barcode: 'SHP-DM-1009',
    modelId: 'iphone-13',
    brandId: 'apple',
    variantId: 'v-13-128-green',
    ram: '4 GB',
    storage: '128 GB',
    colour: 'Green',
    condition: 'used',
    batteryHealth: 88,
    imei1: '356000000000031',
    serial: 'DM-SN-1009',
    purchaseCost: 550000,
    purchaseCurrency: 'IQD',
    sellingPrice: 720000,
    sellingCurrency: 'IQD',
    status: 'sold',
    createdAt: atDaysAgo(30)
  },
  {
    id: 'u-demo-10',
    shortId: 'DM1010',
    barcode: 'SHP-DM-1010',
    modelId: 'tecno-spark-20',
    brandId: 'tecno',
    variantId: 'v-sp20-128-green',
    ram: '8 GB',
    storage: '128 GB',
    colour: 'Magic Skin Green',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1010',
    purchaseCost: 150000,
    purchaseCurrency: 'IQD',
    sellingPrice: 205000,
    sellingCurrency: 'IQD',
    status: 'sold',
    createdAt: atDaysAgo(40)
  },
  {
    id: 'u-demo-11',
    shortId: 'DM1011',
    barcode: 'SHP-DM-1011',
    modelId: 'redmi-13c',
    brandId: 'xiaomi',
    variantId: 'v-r13c-128-green',
    ram: '6 GB',
    storage: '128 GB',
    colour: 'Clover Green',
    condition: 'new',
    batteryHealth: null,
    serial: 'DM-SN-1011',
    purchaseCost: 175000,
    purchaseCurrency: 'IQD',
    sellingPrice: 225000,
    sellingCurrency: 'IQD',
    status: 'in_stock',
    createdAt: atDaysAgo(1)
  }
]

const demoSales: Sale[] = [
  {
    id: 'sale-demo-03',
    invoiceNo: 'INV-2026-0001',
    unitId: 'u-demo-10',
    barcode: 'SHP-DM-1010',
    modelId: 'tecno-spark-20',
    modelName: 'Tecno Spark 20',
    brandName: 'Tecno',
    image: '/catalog/tecno-spark-20.svg',
    variantLabel: '8 GB / 128 GB · Magic Skin Green',
    imeiMasked: '•••• 1010',
    staffId: 'owner',
    staffName: 'Shop Owner',
    customerName: '',
    customerPhone: '',
    currency: 'IQD',
    salePrice: 205000,
    discount: 0,
    total: 205000,
    purchaseCostSnapshot: 150000,
    purchaseCurrency: 'IQD',
    exchangeRate: DEFAULT_RATE,
    paymentMethod: 'cash',
    note: '',
    soldAt: atDaysAgo(6, 12, 5),
    status: 'completed',
    syncStatus: 'local'
  },
  {
    id: 'sale-demo-02',
    invoiceNo: 'INV-2026-0002',
    unitId: 'u-demo-08',
    barcode: 'SHP-DM-1008',
    modelId: 'galaxy-s24',
    modelName: 'Galaxy S24',
    brandName: 'Samsung',
    image: '/catalog/galaxy-s24.svg',
    variantLabel: '8 GB / 128 GB · Onyx Black',
    imeiMasked: '•••• 1008',
    staffId: 'owner',
    staffName: 'Shop Owner',
    customerName: 'Karwan Ali',
    customerPhone: '0750 111 2233',
    currency: 'USD',
    salePrice: 94900,
    discount: 0,
    total: 94900,
    purchaseCostSnapshot: 80000,
    purchaseCurrency: 'USD',
    exchangeRate: DEFAULT_RATE,
    paymentMethod: 'cash',
    note: '',
    soldAt: atDaysAgo(1, 16, 10),
    status: 'completed',
    syncStatus: 'local'
  },
  {
    id: 'sale-demo-01',
    invoiceNo: 'INV-2026-0003',
    unitId: 'u-demo-09',
    barcode: 'SHP-DM-1009',
    modelId: 'iphone-13',
    modelName: 'iPhone 13',
    brandName: 'Apple',
    image: '/catalog/iphone-13.svg',
    variantLabel: '4 GB / 128 GB · Green',
    imeiMasked: '•••• 1009',
    staffId: 'cashier',
    staffName: 'Cashier',
    customerName: 'Sara Ahmed',
    customerPhone: '0770 222 3344',
    currency: 'IQD',
    salePrice: 720000,
    discount: 20000,
    total: 700000,
    purchaseCostSnapshot: 550000,
    purchaseCurrency: 'IQD',
    exchangeRate: DEFAULT_RATE,
    paymentMethod: 'cash',
    note: 'Small discount for a regular customer.',
    soldAt: atDaysAgo(0, 10, 24),
    status: 'completed',
    syncStatus: 'local'
  }
]

function movement(
  id: string,
  unitId: string,
  type: MovementType,
  toStatus: UnitStatus,
  at: string,
  reason = '',
  userId = 'owner',
  fromStatus?: UnitStatus
): StockMovement {
  return { id, unitId, type, fromStatus, toStatus, reason, userId, at }
}

export async function seedDatabase(force = false): Promise<void> {
  const existing = await db.settings.get('shop')
  if (existing && !force) {
    await db.transaction('rw', [db.brands, db.models, db.variants], async () => {
      for (const brand of seedBrands) {
        if (!(await db.brands.get(brand.id))) await db.brands.add(brand)
      }
      for (const model of seedModels) {
        if (!(await db.models.get(model.id))) await db.models.add(model)
      }
      for (const variant of seedVariants) {
        if (!(await db.variants.get(variant.id))) await db.variants.add(variant)
      }
    })
    return
  }

  const settings = defaultSettings()
  if (existing) settings.deviceId = existing.deviceId

  const brandMap = new Map<string, Brand>(seedBrands.map((b) => [b.id, b]))
  const modelMap = new Map<string, PhoneModel>(seedModels.map((m) => [m.id, m]))
  const variantMap = new Map<string, Variant>(seedVariants.map((v) => [v.id, v]))

  const units: InventoryUnit[] = demoUnitInputs.map((input) => ({
    ...input,
    region: 'Global',
    network: 'Dual SIM',
    imei1: input.imei1 ?? '',
    imei2: input.imei2 ?? '',
    serial: input.serial ?? '',
    supplier: 'Demo supplier',
    dateReceived: input.createdAt.slice(0, 10),
    notes: input.notes ?? '',
    exchangeRate: DEFAULT_RATE,
    updatedAt: input.createdAt,
    syncStatus: 'local',
    createdBy: 'owner'
  }))

  const movements: StockMovement[] = []
  units.forEach((unit, index) => {
    movements.push(movement(`mv-demo-add-${index}`, unit.id, 'added', 'in_stock', unit.createdAt))
    if (unit.status === 'sold') {
      const sale = demoSales.find((s) => s.unitId === unit.id)
      movements.push(
        movement(`mv-demo-sold-${index}`, unit.id, 'sold', 'sold', sale?.soldAt ?? unit.updatedAt, '', sale?.staffId ?? 'owner', 'in_stock')
      )
    }
    if (unit.status === 'repair') {
      movements.push(movement(`mv-demo-repair-${index}`, unit.id, 'repair', 'repair', atDaysAgo(3), 'Screen issue', 'owner', 'in_stock'))
    }
  })

  const auditLogs: AuditLog[] = [
    {
      id: uuid(),
      entity: 'shop',
      entityId: 'shop',
      action: 'demo_seeded',
      oldValue: '',
      newValue: 'Demo stock and sales loaded',
      reason: '',
      userId: 'owner',
      at: new Date().toISOString()
    }
  ]

  await db.transaction(
    'rw',
    [db.settings, db.users, db.brands, db.models, db.variants, db.units, db.sales, db.movements, db.auditLogs],
    async () => {
      if (force) {
        await Promise.all([
          db.brands.clear(),
          db.models.clear(),
          db.variants.clear(),
          db.units.clear(),
          db.sales.clear(),
          db.movements.clear(),
          db.auditLogs.clear()
        ])
      }
      await db.settings.put(settings)
      await db.users.bulkPut(defaultUsers)
      await db.brands.bulkPut(seedBrands)
      await db.models.bulkPut(seedModels)
      await db.variants.bulkPut(seedVariants)
      await db.units.bulkPut(units)
      await db.sales.bulkPut(demoSales)
      await db.movements.bulkPut(movements)
      await db.auditLogs.bulkPut(auditLogs)
    }
  )

  // Reference the maps so tree-shaking keeps the catalogue lookups intentional.
  void brandMap
  void modelMap
  void variantMap
}

export async function resetDemoData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.settings, db.users, db.brands, db.models, db.variants, db.units, db.sales, db.movements, db.auditLogs, db.syncOps],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.users.clear(),
        db.brands.clear(),
        db.models.clear(),
        db.variants.clear(),
        db.units.clear(),
        db.sales.clear(),
        db.movements.clear(),
        db.auditLogs.clear(),
        db.syncOps.clear()
      ])
    }
  )
  await seedDatabase(true)
}
