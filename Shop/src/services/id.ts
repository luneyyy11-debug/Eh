export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function randomCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  const values = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values)
  } else {
    for (let i = 0; i < length; i++) values[i] = Math.floor(Math.random() * 0xffffffff)
  }
  for (let i = 0; i < length; i++) out += alphabet[values[i] % alphabet.length]
  return out
}
