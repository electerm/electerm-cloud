/* eslint-env jest */

import me from '../../api/me'
import { verifyJwtAndCheckId } from '../../src/server/control/jwt'
import { delUser } from '../../src/server/control/admin-users'

jest.mock('../../src/server/control/jwt', () => ({
  verifyJwtAndCheckId: jest.fn()
}))

jest.mock('../../src/server/control/admin-users', () => ({
  delUser: jest.fn()
}))

const mockVerify = verifyJwtAndCheckId as unknown as jest.Mock
const mockDel = delUser as unknown as jest.Mock

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
    headers: { authorization: 'authorization user-jwt' },
    query: {},
    body: {}
  }, over)
}

const activeUser = {
  id: 'user-1',
  status: 'active',
  name: 'test user',
  email: 'e2e@example.com',
  avatarUrl: '',
  githubLogin: 'e2e-user'
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVerify.mockImplementation(async (req: any, res: any) => {
    void req
    return activeUser
  })
})

describe('api/me GET', () => {
  it('returns the public profile of the logged-in user', async () => {
    const res = mockRes()
    await me(mockReq() as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toEqual({
      user: {
        name: 'test user',
        email: 'e2e@example.com',
        avatarUrl: '',
        githubLogin: 'e2e-user'
      }
    })
    expect(res.headers['Cache-Control']).toBe('no-store')
  })

  it('403 when the user is disabled', async () => {
    mockVerify.mockResolvedValue({ ...activeUser, status: 'disabled' })
    const res = mockRes()
    await me(mockReq() as any, res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toBe('user disabled')
  })

  it('503 when the service is stopped', async () => {
    process.env.STOP_SERVICE_MSG = 'maintenance'
    try {
      const res = mockRes()
      await me(mockReq() as any, res)
      expect(res.statusCode).toBe(503)
      expect(res.body).toBe('maintenance')
    } finally {
      delete process.env.STOP_SERVICE_MSG
    }
  })

  it('early-returns (401) when verification fails', async () => {
    mockVerify.mockImplementation(async (req: any, res: any) => {
      void req
      res.status(401).send('JWT verification failed')
      return null
    })
    const res = mockRes()
    await me(mockReq() as any, res)
    expect(res.statusCode).toBe(401)
  })
})

describe('api/me DELETE', () => {
  it('deletes the own account with cascade', async () => {
    mockDel.mockResolvedValue(undefined)
    const res = mockRes()
    await me(mockReq({ method: 'DELETE' }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toEqual({ ok: true })
    expect(mockDel).toHaveBeenCalledWith('user-1')
  })

  it('500 generic on failure', async () => {
    mockDel.mockRejectedValue(new Error('DynamoDB: kaput'))
    const res = mockRes()
    await me(mockReq({ method: 'DELETE' }) as any, res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toBe('Internal server error')
  })
})

describe('api/me unsupported method', () => {
  it('404 on PUT', async () => {
    const res = mockRes()
    await me(mockReq({ method: 'PUT' }) as any, res)
    expect(res.statusCode).toBe(404)
    expect(mockVerify).not.toHaveBeenCalled()
  })
})
