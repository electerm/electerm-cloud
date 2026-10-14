/* eslint-env jest */

import auth from '../../api/auth'
import { checkCsrf, clearSessionCookies } from '../../src/server/control/session'

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'STATE_JWT'),
  verify: jest.fn()
}))

jest.mock('../../src/server/control/session', () => ({
  checkCsrf: jest.fn(() => true),
  clearSessionCookies: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken')

const mockCheckCsrf = checkCsrf as unknown as jest.Mock
const mockClear = clearSessionCookies as unknown as jest.Mock

function mockRes () {
  const res: any = {
    statusCode: 0,
    body: undefined,
    headers: {} as Record<string, any>,
    status (code: number) {
      res.statusCode = code
      return res
    },
    send (data: any) {
      res.body = data
      return res
    },
    json (data: any) {
      res.body = data
      return res
    },
    setHeader (key: string, val: any) {
      res.headers[key] = val
      return res
    }
  }
  return res
}

function mockReq (over: any = {}) {
  return Object.assign({
    method: 'GET',
    headers: {},
    query: {},
    body: {}
  }, over)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCheckCsrf.mockReturnValue(true)
})

describe('api/auth fn=login-url', () => {
  it('builds the github login url with state', async () => {
    const res = mockRes()
    await auth(mockReq({ query: { fn: 'login-url' } }) as any, res)
    expect(res.statusCode).toBe(0)
    const loginUrl: string = res.body.loginUrl
    expect(loginUrl).toContain('https://github.com/login/oauth/authorize')
    expect(loginUrl).toContain(`redirect_uri=${encodeURIComponent('http://127.0.0.1:5678/api/github-login-callback')}`)
    expect(loginUrl).toContain('state=STATE_JWT')
    expect(jwt.sign).toHaveBeenCalledWith(
      { isAdmin: false, nonce: expect.any(String) },
      expect.anything(),
      { expiresIn: '10m' }
    )
    expect(res.headers['Cache-Control']).toBe('private, no-store')
  })

  it('flags admin logins', async () => {
    const res = mockRes()
    await auth(mockReq({ query: { fn: 'login-url', isAdmin: 'true' } }) as any, res)
    expect(jwt.sign).toHaveBeenCalledWith(
      { isAdmin: true, nonce: expect.any(String) },
      expect.anything(),
      { expiresIn: '10m' }
    )
  })

  it('404 on POST', async () => {
    const res = mockRes()
    await auth(mockReq({ method: 'POST', query: { fn: 'login-url' } }) as any, res)
    expect(res.statusCode).toBe(404)
  })
})

describe('api/auth fn=logout', () => {
  it('clears cookies when csrf passes', async () => {
    const res = mockRes()
    await auth(mockReq({ method: 'POST', query: { fn: 'logout' } }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toEqual({ ok: true })
    expect(mockCheckCsrf).toHaveBeenCalled()
    expect(mockClear).toHaveBeenCalled()
    expect(res.headers['Cache-Control']).toBe('private, no-store')
  })

  it('403 and no cookie clear when csrf fails', async () => {
    // the real checkCsrf answers 403 itself when it rejects
    mockCheckCsrf.mockImplementation((req: any, res: any) => {
      void req
      res.status(403).send('CSRF check failed')
      return false
    })
    const res = mockRes()
    await auth(mockReq({ method: 'POST', query: { fn: 'logout' } }) as any, res)
    expect(res.statusCode).toBe(403)
    expect(mockClear).not.toHaveBeenCalled()
  })

  it('404 on GET', async () => {
    const res = mockRes()
    await auth(mockReq({ query: { fn: 'logout' } }) as any, res)
    expect(res.statusCode).toBe(404)
  })
})

describe('api/auth unknown fn', () => {
  it('404 for missing/unknown fn', async () => {
    const res1 = mockRes()
    await auth(mockReq() as any, res1)
    expect(res1.statusCode).toBe(404)
    const res2 = mockRes()
    await auth(mockReq({ query: { fn: 'hack' } }) as any, res2)
    expect(res2.statusCode).toBe(404)
  })
})
