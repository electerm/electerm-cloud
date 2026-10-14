/* eslint-env jest */

import sync from '../../api/sync'
import { updateData, getData } from '../../src/server/control/data-control'
import { verifyJwt } from '../../src/server/control/jwt'
import { getToken } from '../../src/server/control/token'
import { UserModel } from '../../src/server/models/db'

jest.mock('../../src/server/control/data-control', () => ({
  updateData: jest.fn(),
  getData: jest.fn()
}))

jest.mock('../../src/server/control/jwt', () => ({
  verifyJwt: jest.fn()
}))

jest.mock('../../src/server/control/token', () => ({
  getToken: jest.fn()
}))

jest.mock('../../src/server/models/db', () => ({
  UserModel: {
    get: jest.fn()
  }
}))

const mockUpdate = updateData as unknown as jest.Mock
const mockGet = getData as unknown as jest.Mock
const mockVerify = verifyJwt as unknown as jest.Mock
const mockGetToken = getToken as unknown as jest.Mock
const mockUserGet = UserModel.get as unknown as jest.Mock

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
    headers: { authorization: 'Bearer user-jwt' },
    query: {},
    body: {}
  }, over)
}

// Shape the electerm client actually uploads: a gist-like object whose file
// contents are opaque strings. With a sync password set, bookmarks/profiles
// contents are 'gcm:<iv>:<salt>:<authtag>:<ciphertext>' hex blobs produced
// client-side — the server must store and return them untouched.
function encryptedSyncPayload () {
  return {
    description: 'sync electerm data',
    files: {
      'bookmarks.json': { content: 'gcm:' + 'ab'.repeat(64) },
      'bookmarks.order.json': { content: 'empty' },
      'profiles.json': { content: 'gcm:' + 'cd'.repeat(64) },
      'quickCommands.json': { content: '[{"id":"qm1"}]' },
      'electerm-status.json': {
        content: JSON.stringify({
          lastSyncTime: 1750000000000,
          electermVersion: '5.6.1',
          deviceName: 'test-mac'
        })
      }
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVerify.mockResolvedValue('uid-1')
  mockGetToken.mockResolvedValue({ userId: 'user-1', dataId: 'data-1' })
  mockUserGet.mockResolvedValue({ id: 'user-1', status: 'active' })
})

describe('api/sync PUT', () => {
  it('stores the payload opaquely, encrypted contents included', async () => {
    mockUpdate.mockResolvedValue('ok')
    const body = encryptedSyncPayload()
    const res = mockRes()
    await sync(mockReq({ method: 'PUT', body }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toBe('ok')
    expect(mockUpdate).toHaveBeenCalledWith('data-1', JSON.stringify(body))
    // the ciphertext must survive stringification byte for byte
    const stored = (mockUpdate.mock.calls[0][1]) as string
    expect(stored).toContain('gcm:' + 'ab'.repeat(64))
    expect(stored).toContain('gcm:' + 'cd'.repeat(64))
  })

  it('413 with a clear message when the payload exceeds the item limit', async () => {
    const big = 'x'.repeat(360 * 1024)
    const res = mockRes()
    await sync(mockReq({
      method: 'PUT',
      body: { files: { 'bookmarks.json': { content: big } } }
    }) as any, res)
    expect(res.statusCode).toBe(413)
    expect(res.body).toContain('too large')
    // must not even attempt the write
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('accepts a payload just under the limit', async () => {
    mockUpdate.mockResolvedValue('ok')
    const near = 'x'.repeat(270 * 1024)
    const res = mockRes()
    await sync(mockReq({
      method: 'PUT',
      body: { files: { 'bookmarks.json': { content: near } } }
    }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('accepts the payload that used to fail with an opaque 500', async () => {
    // production report: client-side gcm password turned bookmarks.json into
    // ~206KB of hex; with hex server-side encoding the stored item hit ~412KB
    // and DynamoDB rejected it as a plain 500. Must go through now.
    mockUpdate.mockResolvedValue('ok')
    const content = 'gcm:' + 'a1b2c3d4'.repeat(25500)
    const res = mockRes()
    await sync(mockReq({
      method: 'PUT',
      body: {
        description: 'sync electerm data',
        files: {
          'bookmarks.json': { content },
          'profiles.json': { content: 'gcm:' + 'e5f6a7b8'.repeat(100) }
        }
      }
    }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toBe('ok')
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('413 instead of 500 when DynamoDB rejects the item as too large', async () => {
    // real DynamoDB wording, verified against DynamoDB Local
    const tooLarge: any = new Error('Item size to update has exceeded the maximum allowed size')
    tooLarge.name = 'ValidationException'
    mockUpdate.mockRejectedValue(tooLarge)
    const res = mockRes()
    await sync(mockReq({
      method: 'PUT',
      body: { files: { 'bookmarks.json': { content: 'x' } } }
    }) as any, res)
    expect(res.statusCode).toBe(413)
    expect(res.body).toContain('too large')
  })

  it('other write errors still propagate', async () => {
    mockUpdate.mockRejectedValue(new Error('network blip'))
    await expect(
      sync(mockReq({
        method: 'PUT',
        body: { files: { 'bookmarks.json': { content: 'x' } } }
      }) as any, mockRes())
    ).rejects.toThrow('network blip')
  })
})

describe('api/sync GET', () => {
  it('returns the stored data as-is', async () => {
    const stored = JSON.stringify(encryptedSyncPayload())
    mockGet.mockResolvedValue({ id: 'data-1', data: stored, userId: 'user-1' })
    const res = mockRes()
    await sync(mockReq({ method: 'GET' }) as any, res)
    expect(res.statusCode).toBe(0)
    expect(res.body).toBe(stored)
    expect(mockGet).toHaveBeenCalledWith('data-1')
  })
})

describe('api/sync guards', () => {
  it('POST is the token test endpoint', async () => {
    const res = mockRes()
    await sync(mockReq({ method: 'POST' }) as any, res)
    expect(res.body).toBe('test ok')
  })

  it('404 on unsupported method, before any auth work', async () => {
    const res = mockRes()
    await sync(mockReq({ method: 'DELETE' }) as any, res)
    expect(res.statusCode).toBe(404)
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('early-returns when jwt verification fails', async () => {
    mockVerify.mockImplementation(async (req: any, res: any) => {
      void req
      res.status(401).send('JWT verification failed')
      return null
    })
    const res = mockRes()
    await sync(mockReq({ method: 'GET' }) as any, res)
    expect(res.statusCode).toBe(401)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('403 when the user is disabled', async () => {
    mockUserGet.mockResolvedValue({ id: 'user-1', status: 'disabled' })
    const res = mockRes()
    await sync(mockReq({ method: 'GET' }) as any, res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toBe('user disabled')
  })

  it('503 when the service is stopped', async () => {
    process.env.STOP_SERVICE_MSG = 'maintenance'
    try {
      const res = mockRes()
      await sync(mockReq({ method: 'GET' }) as any, res)
      expect(res.statusCode).toBe(503)
      expect(res.body).toBe('maintenance')
    } finally {
      delete process.env.STOP_SERVICE_MSG
    }
  })
})
