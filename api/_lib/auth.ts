import { env, fail } from './http.js'

// 單一管理者登入：密碼放在 Vercel 環境變數 ADMIN_PASSWORD。
// 登入成功後發一個 HttpOnly cookie，內容是「到期時間.簽章」，簽章用 SESSION_SECRET 做 HMAC，
// 所以不需要資料庫，也沒辦法在瀏覽器端偽造。

const COOKIE = 'ad_admin'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 天
const enc = new TextEncoder()

function b64url(bytes: ArrayBuffer): string {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
}

/** 長度不同或內容不同都花一樣的時間比較，避免從回應時間猜出內容 */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const x = new Uint8Array(ha)
  const y = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

/** 環境變數沒設好時回傳錯誤訊息，設好回傳 null */
export function configError(): string | null {
  const pw = env('ADMIN_PASSWORD')
  const secret = env('SESSION_SECRET')
  if (!pw || !secret) return '網站還沒設定 ADMIN_PASSWORD 和 SESSION_SECRET'
  if (pw.length < 12) return 'ADMIN_PASSWORD 至少要 12 個字元'
  if (secret.length < 32) return 'SESSION_SECRET 至少要 32 個字元'
  return null
}

export async function checkPassword(input: string): Promise<boolean> {
  const pw = env('ADMIN_PASSWORD')
  if (!pw) return false
  return safeEqual(input, pw)
}

export async function sessionCookie(): Promise<string> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000
  const value = `${expires}.${await hmac(env('SESSION_SECRET')!, String(expires))}`
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE_SECONDS}`
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

export async function isAdmin(request: Request): Promise<boolean> {
  const secret = env('SESSION_SECRET')
  if (!secret || configError()) return false
  const raw = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  if (!raw) return false
  const [expires, sig] = raw.split('.')
  if (!expires || !sig || !/^\d+$/.test(expires) || Number(expires) < Date.now()) return false
  return safeEqual(sig, await hmac(secret, expires))
}

export async function requireAdmin(request: Request): Promise<Response | null> {
  const err = configError()
  if (err) return fail(503, err)
  return (await isAdmin(request)) ? null : fail(401, '請先登入')
}
