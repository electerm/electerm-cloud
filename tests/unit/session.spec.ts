import {
  parseCookies,
  sessionCookieName,
  csrfCookieName,
  setSessionCookie,
  setCsrfCookie,
  clearSessionCookies,
  generateCsrfToken,
  checkCsrf
} from '../../src/server/control/session'

function mockRes (): any {
  const headers: Record<string, any> = {}
  return {
    headers,
    statusCode: 200,
    body: undefined as any,
    status (code: number): any {
      this.statusCode = code
      return this
    },
    send (body: any): any {
      this.body = body
      return this
    },
    getHeader (key: string): any {
      return headers[key]
    },
    setHeader (key: string, val: any): any {
      headers[key] = val
      return this
    }
  }
}

function mockReq (obj: any = {}): any {
  return {
    method: 'GET',
    headers: {},
    ...obj
  }
}

describe('session cookie helpers', () => {
  test('parseCookies parses and uri-decodes', () => {
    const req = mockReq({ headers: { cookie: 'session=abc; csrf=hello%20world' } })
    expect(parseCookies(req)).toEqual({ session: 'abc', csrf: 'hello world' })
  })

  test('parseCookies handles missing/garbage headers', () => {
    expect(parseCookies(mockReq())).toEqual({})
    expect(parseCookies(mockReq({ headers: { cookie: '' } }))).toEqual({})
    expect(parseCookies(mockReq({ headers: { cookie: 'novalue; =x; ok=1' } }))).toEqual({ ok: '1' })
  })

  test('cookie names use __Host- prefix on https and localhost only', () => {
    const https = mockReq({ headers: { 'x-forwarded-proto': 'https', host: 'sync.electerm.org' } })
    const localSecure = mockReq({ headers: { host: '127.0.0.1:5678' } })
    const insecure = mockReq({ headers: { host: '192.168.1.5:5678' } })
    expect(sessionCookieName(https)).toBe('__Host-session')
    expect(csrfCookieName(https)).toBe('__Host-csrf')
    // browsers treat 127.0.0.1 as a secure context, so dev matches prod
    expect(sessionCookieName(localSecure)).toBe('__Host-session')
    expect(csrfCookieName(localSecure)).toBe('__Host-csrf')
    expect(sessionCookieName(insecure)).toBe('session')
    expect(csrfCookieName(insecure)).toBe('csrf')
  })

  test('setSessionCookie is httpOnly, lax, secure-on-https only', () => {
    const insecure = mockRes()
    setSessionCookie(mockReq({ headers: { host: '192.168.1.5:5678' } }), insecure, 'jwt-abc')
    const insecureCookie: string = insecure.headers['Set-Cookie']
    expect(insecureCookie).toContain('session=jwt-abc')
    expect(insecureCookie).toContain('HttpOnly')
    expect(insecureCookie).toContain('SameSite=Lax')
    expect(insecureCookie).toContain('Path=/')
    expect(insecureCookie).toContain('Max-Age=')
    expect(insecureCookie).not.toContain('Secure')

    const prod = mockRes()
    setSessionCookie(mockReq({ headers: { 'x-forwarded-proto': 'https', host: 'sync.electerm.org' } }), prod, 'jwt-abc')
    const prodCookie: string = prod.headers['Set-Cookie']
    expect(prodCookie).toContain('__Host-session=jwt-abc')
    expect(prodCookie).toContain('Secure')
    expect(prodCookie).not.toContain('Domain')
  })

  test('setCsrfCookie is readable (no HttpOnly)', () => {
    const res = mockRes()
    setCsrfCookie(mockReq({ headers: { host: '127.0.0.1:5678' } }), res, 'csrf-tok')
    const cookie: string = res.headers['Set-Cookie']
    expect(cookie).toContain('csrf=csrf-tok')
    expect(cookie).not.toContain('HttpOnly')
  })

  test('clearSessionCookies clears every name variant', () => {
    const res = mockRes()
    clearSessionCookies(mockReq({ headers: { host: '127.0.0.1:5678' } }), res)
    const cookies: string[] = res.headers['Set-Cookie']
    expect(cookies.length).toBe(4)
    for (const c of cookies) {
      expect(c).toContain('Max-Age=0')
    }
    const names = cookies.map((c: string) => c.split('=')[0])
    expect(names).toEqual(['session', '__Host-session', 'csrf', '__Host-csrf'])
  })

  test('generateCsrfToken is 64 hex chars and unique', () => {
    const a = generateCsrfToken()
    const b = generateCsrfToken()
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })
})

describe('checkCsrf', () => {
  const cookieReq = (extra: any = {}): any => mockReq({
    method: 'POST',
    headers: {
      host: '127.0.0.1:5678',
      origin: 'http://127.0.0.1:5678',
      cookie: '__Host-session=jwt-abc; __Host-csrf=tok123',
      ...extra
    },
    ...extra
  })

  test('header-authenticated requests (no session cookie) always pass', () => {
    const req = mockReq({ method: 'POST', headers: { host: '127.0.0.1:5678', origin: 'https://evil.com' } })
    const res = mockRes()
    expect(checkCsrf(req, res)).toBe(true)
    expect(res.statusCode).toBe(200)
  })

  test('reads (GET) with session cookie pass', () => {
    const req = mockReq({ method: 'GET', headers: { host: '127.0.0.1:5678', cookie: 'session=jwt-abc' } })
    expect(checkCsrf(req, mockRes())).toBe(true)
  })

  test('write with matching double-submit token passes', () => {
    const req = cookieReq()
    req.headers['x-csrf-token'] = 'tok123'
    expect(checkCsrf(req, mockRes())).toBe(true)
  })

  test('write without csrf header is rejected with 403', () => {
    const req = cookieReq()
    const res = mockRes()
    expect(checkCsrf(req, res)).toBe(false)
    expect(res.statusCode).toBe(403)
    expect(res.body).toBe('CSRF check failed')
  })

  test('write with wrong csrf token is rejected', () => {
    const req = cookieReq()
    req.headers['x-csrf-token'] = 'tok999'
    const res = mockRes()
    expect(checkCsrf(req, res)).toBe(false)
    expect(res.statusCode).toBe(403)
  })

  test('write with wrong-length token is rejected (timing-safe compare)', () => {
    const req = cookieReq()
    req.headers['x-csrf-token'] = 'to'
    const res = mockRes()
    expect(checkCsrf(req, res)).toBe(false)
  })

  test('cross-origin write is rejected even with matching token', () => {
    const req = cookieReq({ origin: 'https://evil.com' })
    req.headers['x-csrf-token'] = 'tok123'
    const res = mockRes()
    expect(checkCsrf(req, res)).toBe(false)
    expect(res.statusCode).toBe(403)
  })
})
