/* eslint-env jest */

import admin from '../../api/admin'
import { verifyJwtAndCheckId, decode } from '../../src/server/control/jwt'
import { listTokens, delToken, reToken } from '../../src/server/control/token'
import { getAllStatics } from '../../src/server/control/statics'
import { UserModel } from '../../src/server/models/db'

jest.mock('../../src/server/control/jwt', () => ({
  verifyJwtAndCheckId: jest.fn(),
  decode: jest.fn()
}))

jest.mock('../../src/server/control/token', () => ({
  listTokens: jest.fn(),
  delToken: jest.fn(),
  reToken: jest.fn()
}))

jest.mock('../../src/server/control/statics', () => ({
  getAllStatics: jest.fn()
}))

jest.mock('../../src/server/models/db', () => ({
  UserModel: {
    get: jest.fn()
  }
}))

const mockVerify = verifyJwtAndCheckId as unknown as jest.Mock
const mockDecode = decode as unknown as jest.Mock
const mockUserGet = UserModel.get as unknown as jest.Mock
const mockList = listTokens as unknown as jest.Mock
const mockDel = delToken as unknown as jest.Mock
const mockRe = reToken as unknown as jest.Mock
const mockStatics = getAllStatics as unknown as jest.Mock

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
    headers: { authorization: 'authorization admin-jwt' },
    query: {},
    body: {}
  }, over)
}

const adminUser = { id: 'admin-1', tokenIds: '', dataIds: '' }
const targetUser = { id: 'user-1', tokenIds: 'tok-a,tok-b', dataIds: 'd-a,d-b' }

beforeEach(() => {
  jest.clearAllMocks()
  mockVerify.mockImplementation(async (req: any, res: any) => {
    void req
    return adminUser
  })
  mockUserGet.mockResolvedValue(targetUser)
  mockDecode.mockImplementation((id: string) => {
    if (id === 'signed-tok-a') return 'tok-a'
    throw new Error('bad token')
  })
})

describe('api/admin auth', () => {
  it('rejects when admin jwt is invalid', async () => {
    mockVerify.mockImplementation(async (req: any, res: any) => {
      void req
      res.status(401).send('JWT verification failed')
      return null
    })
    const res = mockRes()
    await admin(mockReq({ method: 'DELETE', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'signed-tok-a' } }) as any, res)
    expect(res.statusCode).toBe(401)
    expect(mockDel).not.toHaveBeenCalled()
  })
})

describe('api/admin fn=get-user (POST)', () => {
  it('returns the current admin user', async () => {
    const res = mockRes()
    await admin(mockReq({ method: 'POST', query: {} }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toEqual({
      user: {
        name: undefined,
        email: undefined,
        avatarUrl: undefined,
        githubLogin: undefined
      }
    })
    expect(res.headers['Cache-Control']).toBe('private, no-store')
  })
})

describe('api/admin fn=statics (GET)', () => {
  it('returns statistics', async () => {
    mockStatics.mockResolvedValue({ userCount: 3 })
    const res = mockRes()
    await admin(mockReq({ query: { fn: 'statics' } }) as any, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ userCount: 3 })
  })

  it('500 generic (no internal error leak) on failure', async () => {
    mockStatics.mockRejectedValue(new Error('DynamoDB: kaput at table electerm-Statics'))
    const res = mockRes()
    await admin(mockReq({ query: { fn: 'statics' } }) as any, res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toBe('Internal server error')
  })
})

describe('api/admin fn=tokens', () => {
  it('400 when userId missing', async () => {
    const res = mockRes()
    await admin(mockReq({ query: { fn: 'tokens' } }) as any, res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('userId is required')
  })

  it('404 when target user missing', async () => {
    mockUserGet.mockResolvedValue(undefined)
    const res = mockRes()
    await admin(mockReq({ query: { fn: 'tokens', userId: 'nope' } }) as any, res)
    expect(res.statusCode).toBe(404)
  })

  it('lists target user tokens', async () => {
    const tokens = [{ id: 'signed-tok-a', name: 'a' }]
    mockList.mockResolvedValue(tokens)
    const res = mockRes()
    await admin(mockReq({ query: { fn: 'tokens', userId: 'user-1' } }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toEqual({ tokens })
    // ids are the raw (split) ids, not the signed ones
    expect(mockList).toHaveBeenCalledWith(['tok-a', 'tok-b'])
  })

  it('400 when token id missing', async () => {
    const res = mockRes()
    await admin(mockReq({ method: 'DELETE', query: { fn: 'tokens' }, body: { userId: 'user-1' } }) as any, res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('token id is required')
  })

  it('400 when token id is not a valid jwt', async () => {
    const res = mockRes()
    await admin(mockReq({ method: 'DELETE', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'garbage' } }) as any, res)
    expect(res.statusCode).toBe(400)
    expect(res.body).toBe('Invalid token id')
  })

  it('deletes the target user token with decoded id', async () => {
    mockDel.mockResolvedValue(undefined)
    const res = mockRes()
    await admin(mockReq({ method: 'DELETE', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'signed-tok-a' } }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toEqual({ ok: true })
    expect(mockDel).toHaveBeenCalledWith('tok-a', targetUser)
  })

  it('403 when token does not belong to the user', async () => {
    mockDel.mockRejectedValue(new Error('Token not found or access denied'))
    const res = mockRes()
    await admin(mockReq({ method: 'DELETE', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'signed-tok-a' } }) as any, res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toBe('Token not found or access denied')
  })

  it('500 generic (no internal error leak) on unexpected failure', async () => {
    mockDel.mockRejectedValue(new Error('DynamoDB: kaput at table electerm-Data'))
    const res = mockRes()
    await admin(mockReq({ method: 'DELETE', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'signed-tok-a' } }) as any, res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toBe('Internal server error')
    expect(res.body).not.toContain('DynamoDB')
  })

  it('regenerates the token on PATCH', async () => {
    const token = { id: 'signed-tok-new', name: 'a' }
    mockRe.mockResolvedValue(token)
    const res = mockRes()
    await admin(mockReq({ method: 'PATCH', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'signed-tok-a' } }) as any, res)
    expect(res.body).toEqual({ token })
    expect(mockRe).toHaveBeenCalledWith('tok-a', targetUser)
  })

  it('404 on unsupported method for fn=tokens', async () => {
    const res = mockRes()
    await admin(mockReq({ method: 'POST', query: { fn: 'tokens' }, body: { userId: 'user-1', id: 'signed-tok-a' } }) as any, res)
    expect(res.statusCode).toBe(404)
  })
})

describe('api/admin unknown fn', () => {
  it('404 when fn is missing on GET', async () => {
    const res = mockRes()
    await admin(mockReq({ query: {} }) as any, res)
    expect(res.statusCode).toBe(404)
  })

  it('404 for an unknown fn', async () => {
    const res = mockRes()
    await admin(mockReq({ query: { fn: 'drop-tables' } }) as any, res)
    expect(res.statusCode).toBe(404)
  })
})
