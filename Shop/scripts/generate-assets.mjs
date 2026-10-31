/**
 * Generates local, licence-free artwork for the shop catalogue and PWA icons.
 * Run with: npm run assets
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const OUT_CATALOG = 'public/catalog'
const OUT_ICONS = 'public/icons'
mkdirSync(OUT_CATALOG, { recursive: true })
mkdirSync(OUT_ICONS, { recursive: true })

const models = [
  { id: 'iphone-15-pro-max', brand: 'apple', bg1: '#1c2434', bg2: '#46536b', accent: '#c8a96a', body: '#3a4354', camera: 'triple', ratio: 0.47 },
  { id: 'iphone-15', brand: 'apple', bg1: '#263143', bg2: '#7186a3', accent: '#9fd7c9', body: '#d9e2ea', camera: 'dual', ratio: 0.48 },
  { id: 'iphone-14', brand: 'apple', bg1: '#312e44', bg2: '#8a7ba8', accent: '#f0c9d4', body: '#4d4560', camera: 'dual', ratio: 0.48 },
  { id: 'iphone-13', brand: 'apple', bg1: '#123a3d', bg2: '#6bb8a9', accent: '#d9fff4', body: '#eef7f5', camera: 'dual', ratio: 0.48 },
  { id: 'galaxy-s24-ultra', brand: 'samsung', bg1: '#111a3a', bg2: '#3d5bb5', accent: '#b9c6ff', body: '#2a3145', camera: 'quad', ratio: 0.48 },
  { id: 'galaxy-s24', brand: 'samsung', bg1: '#2b1739', bg2: '#9c5bb3', accent: '#ffd9f4', body: '#efe4f2', camera: 'triple', ratio: 0.48 },
  { id: 'galaxy-a55', brand: 'samsung', bg1: '#0e2f47', bg2: '#2a8fb8', accent: '#c3f2ff', body: '#274153', camera: 'triple', ratio: 0.49 },
  { id: 'galaxy-a35', brand: 'samsung', bg1: '#302315', bg2: '#b57a39', accent: '#ffe2b8', body: '#433224', camera: 'triple', ratio: 0.49 },
  { id: 'galaxy-z-flip-5', brand: 'samsung', bg1: '#2f2845', bg2: '#9f8ec8', accent: '#e6ddff', body: '#d9d2ea', camera: 'dual', ratio: 0.44, flip: true },
  { id: 'redmi-note-13-pro', brand: 'xiaomi', bg1: '#3a1a0b', bg2: '#e06a1d', accent: '#ffe0c2', body: '#2d2d2d', camera: 'quad', ratio: 0.49 },
  { id: 'redmi-13c', brand: 'xiaomi', bg1: '#10392a', bg2: '#3fa66f', accent: '#dcffe8', body: '#24352d', camera: 'dual', ratio: 0.49 },
  { id: 'xiaomi-14', brand: 'xiaomi', bg1: '#1a2b3a', bg2: '#5596b8', accent: '#d8f4ff', body: '#e6edf1', camera: 'triple', ratio: 0.49 },
  { id: 'poco-x6-pro', brand: 'poco', bg1: '#34290a', bg2: '#e0b52e', accent: '#fff1b8', body: '#202020', camera: 'triple', ratio: 0.49 },
  { id: 'poco-m6', brand: 'poco', bg1: '#2e1230', bg2: '#b13fa8', accent: '#ffd6fb', body: '#29212c', camera: 'dual', ratio: 0.49 },
  { id: 'infinix-note-40', brand: 'infinix', bg1: '#062e25', bg2: '#17a677', accent: '#c7ffe8', body: '#173b31', camera: 'triple', ratio: 0.49 },
  { id: 'infinix-hot-40', brand: 'infinix', bg1: '#2d1420', bg2: '#c44973', accent: '#ffd9e4', body: '#38222b', camera: 'dual', ratio: 0.49 },
  { id: 'tecno-camon-20', brand: 'tecno', bg1: '#0a1d3d', bg2: '#3468d6', accent: '#cfe0ff', body: '#18263f', camera: 'triple', ratio: 0.49 },
  { id: 'tecno-spark-20', brand: 'tecno', bg1: '#15301c', bg2: '#63a63d', accent: '#e1ffc7', body: '#27392a', camera: 'dual', ratio: 0.49 }
]

function cameraModule(count) {
  const positions = {
    triple: [
      [242, 258], [300, 258], [242, 316]
    ],
    dual: [
      [242, 258], [300, 258]
    ],
    quad: [
      [242, 258], [300, 258], [242, 316], [300, 316]
    ]
  }[count] ?? []
  return `
    <rect x="222" y="236" width="118" height="${count === 'dual' ? 96 : 134}" rx="26" fill="#101317" opacity="0.92"/>
    ${positions.map(([x, y]) => `
      <circle cx="${x}" cy="${y}" r="20" fill="#0a0c0f"/>
      <circle cx="${x}" cy="${y}" r="14" fill="#26313c"/>
      <circle cx="${x - 4}" cy="${y - 4}" r="5" fill="#8da4b8" opacity="0.8"/>
      <circle cx="${x + 3}" cy="${y + 4}" r="3" fill="#5d6b7b"/>
    `).join('')}
    <circle cx="320" cy="352" r="7" fill="${count === 'quad' ? '#ffe9a8' : '#f6f8ff'}" opacity="0.8"/>
  `
}

function phoneSvg(m) {
  const width = 176
  const height = 352
  const x = (640 - width) / 2
  const y = 116
  const screenX = x + 9
  const screenY = y + 9
  const screenW = width - 18
  const screenH = height - 18
  const tilt = m.flip ? `rotate(-7 320 320)` : `rotate(-7 320 320)`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.bg1}"/>
      <stop offset="1" stop-color="${m.bg2}"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.body}"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.62"/>
      <stop offset="1" stop-color="${m.body}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.accent}" stop-opacity="0.92"/>
      <stop offset="0.45" stop-color="${m.bg1}"/>
      <stop offset="1" stop-color="${m.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="46%" r="55%">
      <stop offset="0" stop-color="${m.accent}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${m.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#050a12" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="640" height="640" fill="url(#bg)"/>
  <circle cx="320" cy="318" r="260" fill="url(#glow)"/>
  <g opacity="0.17" fill="none" stroke="#ffffff" stroke-width="2">
    <circle cx="530" cy="118" r="88"/>
    <circle cx="530" cy="118" r="124"/>
    <circle cx="92" cy="544" r="74"/>
  </g>
  <g transform="${tilt}" filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="34" fill="url(#body)"/>
    <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="27" fill="url(#screen)"/>
    <rect x="${screenX + 10}" y="${screenY + 10}" width="${screenW - 20}" height="${screenH - 20}" rx="21" fill="${m.bg1}" opacity="0.4"/>
    <path d="M${screenX + 18} ${screenY + screenH - 76} L${screenX + 82} ${screenY + 102} L${screenX + 112} ${screenY + 152} L${screenX + screenW - 16} ${screenY + 40} L${screenX + screenW - 16} ${screenY + screenH - 18} L${screenX + 18} ${screenY + screenH - 18} Z" fill="${m.accent}" opacity="0.28"/>
    <rect x="272" y="132" width="96" height="19" rx="9.5" fill="#0b0e14"/>
    ${cameraModule(m.camera)}
    <circle cx="289" cy="151" r="3" fill="#324152"/>
    <rect x="406" y="230" width="5" height="46" rx="2.5" fill="#0b0e14" opacity="0.4"/>
    <rect x="406" y="286" width="5" height="28" rx="2.5" fill="#0b0e14" opacity="0.4"/>
    <rect x="${x - 5}" y="226" width="5" height="38" rx="2.5" fill="#0b0e14" opacity="0.35"/>
    <rect x="${x - 5}" y="276" width="5" height="56" rx="2.5" fill="#0b0e14" opacity="0.35"/>
    <rect x="250" y="${y + height - 17}" width="140" height="5" rx="2.5" fill="#ffffff" opacity="0.45"/>
  </g>
  <text x="320" y="598" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="20" letter-spacing="5" fill="#ffffff" opacity="0.68">${m.brand.toUpperCase()}</text>
</svg>`
}

for (const model of models) {
  writeFileSync(`${OUT_CATALOG}/${model.id}.svg`, phoneSvg(model))
}

// A neutral placeholder used by newly created catalogue models.
writeFileSync(`${OUT_CATALOG}/placeholder.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe4f0"/><stop offset="1" stop-color="#9fb4cc"/></linearGradient></defs>
  <rect width="640" height="640" fill="url(#g)"/>
  <g transform="rotate(-7 320 320)" fill="none" stroke="#ffffff" stroke-width="14" opacity="0.8">
    <rect x="242" y="142" width="156" height="330" rx="34"/>
    <rect x="260" y="162" width="120" height="286" rx="24"/>
    <circle cx="320" cy="436" r="11" fill="#ffffff" stroke="none"/>
  </g>
</svg>`)

// ---------------------------------------------------------------------------
// PNG app icons (drawn directly, no external image tooling required)
// ---------------------------------------------------------------------------
function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) {
    crc ^= b
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function png(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  const ihdr = chunk('IHDR', header)
  const idat = chunk('IDAT', deflateSync(raw, { level: 9 }))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ihdr, idat, iend])
}

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function renderIcon(size, maskable = false) {
  const scale = 3
  const S = size * scale
  const px = Buffer.alloc(S * S * 4)
  const mix = (a, b, t) => a + (b - a) * t
  const bg1 = hex('#0b1f3a')
  const bg2 = hex('#0f766e')
  const accent = hex('#5eead4')
  const white = [255, 255, 255]

  const set = (x, y, color, alpha = 1) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return
    const i = (y * S + x) * 4
    const a = alpha * (color[3] ?? 1)
    px[i] = Math.round(mix(px[i], color[0], a))
    px[i + 1] = Math.round(mix(px[i + 1], color[1], a))
    px[i + 2] = Math.round(mix(px[i + 2], color[2], a))
    px[i + 3] = Math.max(px[i + 3], Math.round(255 * a))
  }

  const rounded = (x0, y0, w, h, r, color, alpha = 1) => {
    for (let y = Math.floor(y0); y < y0 + h; y++) {
      for (let x = Math.floor(x0); x < x0 + w; x++) {
        const dx = Math.max(x0 + r - x, x - (x0 + w - r), 0)
        const dy = Math.max(y0 + r - y, y - (y0 + h - r), 0)
        if (dx * dx + dy * dy <= r * r) set(x, y, color, alpha)
      }
    }
  }

  const circle = (cx, cy, r, color, alpha = 1) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, color, alpha)
      }
    }
  }

  // Background gradient
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const t = Math.max(0, Math.min(1, (x / S) * 0.45 + (y / S) * 0.55))
      set(x, y, [mix(bg1[0], bg2[0], t), mix(bg1[1], bg2[1], t), mix(bg1[2], bg2[2], t), 1])
    }
  }

  const content = maskable ? 0.68 : 0.82
  const unit = (S * content) / 100
  const ox = (S - unit * 100) / 2
  const oy = (S - unit * 100) / 2
  const U = (v) => ox + v * unit
  const V = (v) => oy + v * unit

  // Soft glow ring
  for (let r = 44; r > 0; r -= 1) {
    circle(U(50), V(47), r * unit, accent, 0.0035)
  }

  // Phone body
  rounded(U(35), V(14), unit * 30, unit * 66, unit * 8, white, 0.97)
  rounded(U(38.5), V(18), unit * 23, unit * 58, unit * 5, [11, 31, 58], 1)
  rounded(U(41.5), V(23), unit * 17, unit * 42, unit * 2.6, [20, 60, 92], 1)

  // Barcode on screen
  const bars = [2.5, 1.5, 3, 1.5, 2, 3.5, 1.5, 2.5, 1.5, 2, 3, 1.5]
  let bx = 43
  for (const bar of bars) {
    rounded(U(bx), V(28), unit * bar, unit * 20, 0, accent, 0.95)
    bx += bar + 1.6
  }

  // Camera + home indicator
  circle(U(50), V(19.5), unit * 1.5, accent, 0.95)
  rounded(U(45), V(71), unit * 10, unit * 1.6, unit * 0.8, white, 0.9)
  // Accent dot bottom-right
  circle(U(74), V(74), unit * 3.2, accent, 1)
  circle(U(74), V(74), unit * 1.4, [11, 31, 58], 1)

  // Downsample
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const i = ((y * scale + sy) * S + (x * scale + sx)) * 4
          r += px[i]; g += px[i + 1]; b += px[i + 2]; a += px[i + 3]
        }
      }
      const n = scale * scale
      const i = (y * size + x) * 4
      out[i] = Math.round(r / n)
      out[i + 1] = Math.round(g / n)
      out[i + 2] = Math.round(b / n)
      out[i + 3] = Math.round(a / n)
    }
  }
  return png(size, size, out)
}

writeFileSync(`${OUT_ICONS}/icon-192.png`, renderIcon(192))
writeFileSync(`${OUT_ICONS}/icon-512.png`, renderIcon(512))
writeFileSync(`${OUT_ICONS}/maskable-512.png`, renderIcon(512, true))
writeFileSync(`${OUT_ICONS}/apple-touch-icon.png`, renderIcon(180))

writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1f3a"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <rect x="23" y="10" width="19" height="42" rx="5" fill="#fff"/>
  <rect x="25.5" y="13" width="14" height="36" rx="3" fill="#0b1f3a"/>
  <g fill="#5eead4"><rect x="28" y="20" width="2" height="12"/><rect x="31" y="20" width="1.2" height="12"/><rect x="33.2" y="20" width="2.4" height="12"/><rect x="36.6" y="20" width="1.2" height="12"/></g>
  <circle cx="32.5" cy="15" r=".9" fill="#5eead4"/>
</svg>`)

console.log(`Generated ${models.length} catalogue images, placeholder, and PWA icons.`)
