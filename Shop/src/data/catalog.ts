import type { Brand, PhoneModel, Variant } from '../types'

export const seedBrands: Brand[] = [
  { id: 'apple', name: 'Apple', color: '#1f2937', sort: 1, active: true },
  { id: 'samsung', name: 'Samsung', color: '#1428a0', sort: 2, active: true },
  { id: 'xiaomi', name: 'Xiaomi / Redmi', color: '#ff6900', sort: 3, active: true },
  { id: 'poco', name: 'POCO', color: '#d4a017', sort: 4, active: true },
  { id: 'infinix', name: 'Infinix', color: '#00a860', sort: 5, active: true },
  { id: 'tecno', name: 'Tecno', color: '#0b57d0', sort: 6, active: true }
]

export const seedModels: PhoneModel[] = [
  {
    id: 'iphone-15-pro-max',
    brandId: 'apple',
    name: 'iPhone 15 Pro Max',
    family: 'iPhone 15 series',
    image: '/catalog/iphone-15-pro-max.svg',
    specs: '6.7" OLED · A17 Pro · 5× zoom',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'iphone-15',
    brandId: 'apple',
    name: 'iPhone 15',
    family: 'iPhone 15 series',
    image: '/catalog/iphone-15.svg',
    specs: '6.1" OLED · A16 Bionic · USB-C',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'iphone-14',
    brandId: 'apple',
    name: 'iPhone 14',
    family: 'iPhone 14 series',
    image: '/catalog/iphone-14.svg',
    specs: '6.1" OLED · A15 Bionic',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'iphone-13',
    brandId: 'apple',
    name: 'iPhone 13',
    family: 'iPhone 13 series',
    image: '/catalog/iphone-13.svg',
    specs: '6.1" OLED · A15 Bionic',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'galaxy-s24-ultra',
    brandId: 'samsung',
    name: 'Galaxy S24 Ultra',
    family: 'Galaxy S',
    image: '/catalog/galaxy-s24-ultra.svg',
    specs: '6.8" AMOLED · Snapdragon 8 Gen 3 · S Pen',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'galaxy-s24',
    brandId: 'samsung',
    name: 'Galaxy S24',
    family: 'Galaxy S',
    image: '/catalog/galaxy-s24.svg',
    specs: '6.2" AMOLED · Snapdragon 8 Gen 3',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'galaxy-a55',
    brandId: 'samsung',
    name: 'Galaxy A55',
    family: 'Galaxy A',
    image: '/catalog/galaxy-a55.svg',
    specs: '6.6" AMOLED · Exynos 1480',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'galaxy-a35',
    brandId: 'samsung',
    name: 'Galaxy A35',
    family: 'Galaxy A',
    image: '/catalog/galaxy-a35.svg',
    specs: '6.6" AMOLED · Exynos 1380',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'galaxy-z-flip-5',
    brandId: 'samsung',
    name: 'Galaxy Z Flip 5',
    family: 'Galaxy Z',
    image: '/catalog/galaxy-z-flip-5.svg',
    specs: '6.7" foldable · Snapdragon 8 Gen 2',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'redmi-note-13-pro',
    brandId: 'xiaomi',
    name: 'Redmi Note 13 Pro',
    family: 'Redmi Note',
    image: '/catalog/redmi-note-13-pro.svg',
    specs: '6.67" AMOLED · 200MP camera',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'redmi-13c',
    brandId: 'xiaomi',
    name: 'Redmi 13C',
    family: 'Redmi',
    image: '/catalog/redmi-13c.svg',
    specs: '6.74" display · 50MP camera',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'xiaomi-14',
    brandId: 'xiaomi',
    name: 'Xiaomi 14',
    family: 'Xiaomi',
    image: '/catalog/xiaomi-14.svg',
    specs: '6.36" AMOLED · Snapdragon 8 Gen 3 · Leica',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'poco-x6-pro',
    brandId: 'poco',
    name: 'POCO X6 Pro',
    family: 'POCO X',
    image: '/catalog/poco-x6-pro.svg',
    specs: '6.67" AMOLED · Dimensity 8300 Ultra',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'poco-m6',
    brandId: 'poco',
    name: 'POCO M6',
    family: 'POCO M',
    image: '/catalog/poco-m6.svg',
    specs: '6.79" display · 50MP camera',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'infinix-note-40',
    brandId: 'infinix',
    name: 'Infinix Note 40',
    family: 'Note',
    image: '/catalog/infinix-note-40.svg',
    specs: '6.78" AMOLED · 45W fast charge',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'infinix-hot-40',
    brandId: 'infinix',
    name: 'Infinix Hot 40',
    family: 'Hot',
    image: '/catalog/infinix-hot-40.svg',
    specs: '6.78" display · 50MP camera',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tecno-camon-20',
    brandId: 'tecno',
    name: 'Tecno Camon 20',
    family: 'Camon',
    image: '/catalog/tecno-camon-20.svg',
    specs: '6.67" AMOLED · 64MP camera',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tecno-spark-20',
    brandId: 'tecno',
    name: 'Tecno Spark 20',
    family: 'Spark',
    image: '/catalog/tecno-spark-20.svg',
    specs: '6.6" display · 50MP camera',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
]

const variant = (id: string, modelId: string, ram: string, storage: string, colour: string, region = 'Global'): Variant => ({
  id,
  modelId,
  ram,
  storage,
  colour,
  region,
  active: true
})

export const seedVariants: Variant[] = [
  variant('v-15pm-256-natural', 'iphone-15-pro-max', '8 GB', '256 GB', 'Natural Titanium'),
  variant('v-15pm-512-blue', 'iphone-15-pro-max', '8 GB', '512 GB', 'Blue Titanium'),
  variant('v-15-128-blue', 'iphone-15', '6 GB', '128 GB', 'Blue'),
  variant('v-15-256-black', 'iphone-15', '6 GB', '256 GB', 'Black'),
  variant('v-14-128-midnight', 'iphone-14', '6 GB', '128 GB', 'Midnight'),
  variant('v-13-128-green', 'iphone-13', '4 GB', '128 GB', 'Green'),
  variant('v-s24u-256-gray', 'galaxy-s24-ultra', '12 GB', '256 GB', 'Titanium Gray'),
  variant('v-s24u-512-black', 'galaxy-s24-ultra', '12 GB', '512 GB', 'Titanium Black'),
  variant('v-s24-128-onyx', 'galaxy-s24', '8 GB', '128 GB', 'Onyx Black'),
  variant('v-a55-256-navy', 'galaxy-a55', '8 GB', '256 GB', 'Awesome Navy'),
  variant('v-a35-128-black', 'galaxy-a35', '8 GB', '128 GB', 'Awesome Black'),
  variant('v-flip5-256-cream', 'galaxy-z-flip-5', '8 GB', '256 GB', 'Cream'),
  variant('v-rn13p-256-black', 'redmi-note-13-pro', '8 GB', '256 GB', 'Midnight Black'),
  variant('v-rn13p-512-purple', 'redmi-note-13-pro', '12 GB', '512 GB', 'Aurora Purple'),
  variant('v-r13c-128-green', 'redmi-13c', '6 GB', '128 GB', 'Clover Green'),
  variant('v-mi14-256-black', 'xiaomi-14', '12 GB', '256 GB', 'Black'),
  variant('v-px6p-512-yellow', 'poco-x6-pro', '12 GB', '512 GB', 'Yellow'),
  variant('v-px6p-256-black', 'poco-x6-pro', '8 GB', '256 GB', 'Black'),
  variant('v-pm6-128-purple', 'poco-m6', '6 GB', '128 GB', 'Purple'),
  variant('v-in40-256-black', 'infinix-note-40', '8 GB', '256 GB', 'Obsidian Black'),
  variant('v-ih40-128-blue', 'infinix-hot-40', '8 GB', '128 GB', 'Starlit Blue'),
  variant('v-c20-256-blue', 'tecno-camon-20', '8 GB', '256 GB', 'Serenity Blue'),
  variant('v-sp20-128-green', 'tecno-spark-20', '8 GB', '128 GB', 'Magic Skin Green')
]
