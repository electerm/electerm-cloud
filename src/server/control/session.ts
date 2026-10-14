import { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

// 120 years, matching the default JWT_EXPIRES_IN, so the cookie never
// expires before the token it carries
const maxAge = 120 * 365 * 24 * 3600

export function isSecureContext (req: VercelRequest): boolean {
  const proto = req.headers['x-forwarded-proto']
  if (typeof proto === 'string' && proto !== '') {
    return proto.split(',')[0].trim() === 'https'
  }
  const host = req.headers.host ?? ''
  return host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')
}

// __Host- prefix cookies (Secure + Path=/ + no Domain) whenever possible;
// plain names on plain http so local dev keeps working
export function sessionCookieName (req: VercelRequest): string {
  return isSecureContext(req) ? '__Host-session' : 'session'
}

// readable by JS on purpose: double-submit pattern
export function csrfCookieName (req: VercelRequest): string {
  return isSecureContext(req) ? '__Host-csrf' : 'csrf'
}

export function parseCookies (req: VercelRequest): Record<string, string> {
  const out: Record<string, string> = {}
  const header = req.headers.cookie
  if (typeof header !== 'string' || header === '') return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    const key = part.slice(0, idx).trim()
    const raw = part.slice(idx + 1).trim()
    if (key === '') continue
    try {
      out[key] = decodeURIComponent(raw)
    } catch {
      out[key] = raw
    }
  }
  return out
}

export function getSessionToken (req: VercelRequest): string {
  const cookies = parseCookies(req)
  return cookies[sessionCookieName(req)] ?? ''
}

export function getCsrfToken (req: VercelRequest): string {
  const cookies = parseCookies(req)
  return cookies[csrfCookieName(req)] ?? ''
}

function appendSetCookie (res: VercelResponse, value: string): void {
  const existing = res.getHeader('Set-Cookie')
  if (existing === undefined) {
    res.setHeader('Set-Cookie', value)
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, value])
  } else {
    res.setHeader('Set-Cookie', [String(existing), value])
  }
}

function cookieAttrs (req: VercelRequest, httpOnly: boolean): string {
  const attrs = [
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ]
  if (httpOnly) {
    attrs.push('HttpOnly')
  }
  if (isSecureContext(req)) {
    attrs.push('Secure')
  }
  return attrs.join('; ')
}

// session JWT, httpOnly so no script can read it
export function setSessionCookie (req: VercelRequest, res: VercelResponse, token: string): void {
  appendSetCookie(
    res,
    `${sessionCookieName(req)}=${encodeURIComponent(token)}; ${cookieAttrs(req, true)}`
  )
}

export function setCsrfCookie (req: VercelRequest, res: VercelResponse, token: string): void {
  appendSetCookie(
    res,
    `${csrfCookieName(req)}=${encodeURIComponent(token)}; ${cookieAttrs(req, false)}`
  )
}

// clear both name variants (a session may have been set under either)
export function clearSessionCookies (req: VercelRequest, res: VercelResponse): void {
  const secure = isSecureContext(req)
  for (const name of ['session', '__Host-session', 'csrf', '__Host-csrf']) {
    appendSetCookie(
      res,
      `${name}=; Path=/; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
    )
  }
}

export function generateCsrfToken (): string {
  return crypto.randomBytes(32).toString('hex')
}

const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

// browsers always send Origin on cross-origin writes; non-browser clients
// (desktop electerm) send none at all
function sameOrigin (req: VercelRequest): boolean {
  const origin = req.headers.origin
  if (typeof origin !== 'string' || origin === '') {
    return true
  }
  try {
    const fwdHost = req.headers['x-forwarded-host']
    const host = fwdHost ?? req.headers.host ?? ''
    const hostStr = Array.isArray(host) ? host[0] : host
    return new URL(origin).host === hostStr
  } catch {
    return false
  }
}

function safeEqual (a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    return false
  }
  return crypto.timingSafeEqual(ab, bb)
}

// CSRF gate for cookie-authenticated writes. Header-authenticated
// (desktop/API) traffic carries no session cookie and is not CSRF-able,
// because a cross-site page cannot set a custom Authorization header.
export function checkCsrf (req: VercelRequest, res: VercelResponse): boolean {
  if (getSessionToken(req) === '') {
    return true
  }
  if (!writeMethods.includes(req.method ?? '')) {
    return true
  }
  if (!sameOrigin(req)) {
    res.status(403).send('CSRF check failed')
    return false
  }
  const cookieToken = getCsrfToken(req)
  const rawHeader = req.headers['x-csrf-token']
  const headerToken = typeof rawHeader === 'string' ? rawHeader : ''
  if (cookieToken === '' || headerToken === '' || !safeEqual(cookieToken, headerToken)) {
    res.status(403).send('CSRF check failed')
    return false
  }
  return true
}
