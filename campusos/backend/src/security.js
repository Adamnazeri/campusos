import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'

const b64u = (b) => Buffer.from(b).toString('base64url')

export function signJwt(payload, secret, ttlSec) {
  const now = Math.floor(Date.now() / 1000)
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64u(JSON.stringify({ ...payload, iat: now, exp: now + ttlSec }))
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}

export function verifyJwt(token, secret) {
  const parts = String(token).split('.')
  if (parts.length !== 3) return null
  const expected = createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest()
  const given = Buffer.from(parts[2], 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return p.exp > Math.floor(Date.now() / 1000) ? p : null
  } catch {
    return null
  }
}

export function hashPassword(pw) {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, 64)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function checkPassword(pw, stored) {
  const [alg, salt, hash] = String(stored ?? '').split('$')
  if (alg !== 'scrypt') return false
  const expected = Buffer.from(hash, 'base64')
  const actual = scryptSync(pw, Buffer.from(salt, 'base64'), expected.length)
  return timingSafeEqual(actual, expected)
}

export const newToken = () => randomBytes(32).toString('base64url')
export const sha256 = (s) => createHash('sha256').update(s).digest('hex')
export const newId = () => randomBytes(8).toString('hex')

// ---- TOTP (RFC 6238, SHA-1, 6 digit, 30s) — serasi Google Authenticator / Authy ----
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function base32(buf) {
  let bits = '', out = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]
  return out
}
function unbase32(str) {
  let bits = ''
  for (const c of str.replace(/=+$/, '').toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, '0')
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}
export const newTotpSecret = () => base32(randomBytes(20))
export function totpCode(secret, atMs = Date.now()) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(atMs / 30_000)))
  const h = createHmac('sha1', unbase32(secret)).update(counter).digest()
  const o = h[h.length - 1] & 0xf
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}
export function verifyTotp(secret, code, atMs = Date.now()) {
  if (!/^\d{6}$/.test(String(code ?? ''))) return false
  return [-1, 0, 1].some((w) => {
    const expected = Buffer.from(totpCode(secret, atMs + w * 30_000))
    const given = Buffer.from(String(code))
    return expected.length === given.length && timingSafeEqual(expected, given)
  })
}
