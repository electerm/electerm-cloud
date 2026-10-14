import type { VercelRequest, VercelResponse } from '@vercel/node'
import { updateData, getData } from '../src/server/control/data-control'
import { verifyJwt } from '../src/server/control/jwt'
import { getToken } from '../src/server/control/token'
import { UserModel } from '../src/server/models/db'

// DynamoDB caps a stored item at 400KB. Two layers inflate the payload:
// the electerm client encrypts bookmarks/profiles with aes-256-gcm before
// upload (hex framing, ~2x), and the server re-encrypts at rest (base64,
// ~1.37x). Payloads that used to fit can exceed the limit and fail with an
// opaque 500, so reject early with a clear message instead. 280KB leaves
// ~27KB headroom under the 400KB item cap after server-side encoding.
const MAX_SYNC_PAYLOAD = 280 * 1024

// DynamoDB rejects oversized items with a ValidationException whose message
// mentions the item size; surface it as a 413 instead of letting it bubble up
// as a platform 500. Matched on message text only — the error class differs
// between the raw SDK and dynamoose's wrappers.
function isItemTooLarge (e: any): boolean {
  const msg = String(e?.message ?? '')
  return /item size|maximum allowable|too large/i.test(msg)
}

export default async function syncHandler (req: VercelRequest, res: VercelResponse): Promise<void> {
  const {
    method = ''
  } = req
  const arr = ['GET', 'PUT', 'POST']
  if (process.env.STOP_SERVICE_MSG !== undefined) {
    res.status(503).send(process.env.STOP_SERVICE_MSG)
    return
  }
  if (!arr.includes(method)) {
    res.status(404).send('404 not found')
    return
  }
  const id = await verifyJwt(req, res)
  if (id === null) {
    return
  }
  const token = await getToken(id)
  const user = await UserModel.get({ id: token.userId })
  if (user !== undefined && user !== null && user.status === 'disabled') {
    res.status(403).send('user disabled')
    return
  }
  const { dataId } = token
  if (method === 'POST') {
    res.send('test ok')
    return
  }
  if (method === 'PUT') {
    const payload = JSON.stringify(req.body)
    if (Buffer.byteLength(payload, 'utf8') > MAX_SYNC_PAYLOAD) {
      res.status(413).send(`sync data too large, max ${MAX_SYNC_PAYLOAD / 1024}KB`)
      return
    }
    try {
      const data = await updateData(dataId, payload)
      res.send(data)
    } catch (e) {
      if (isItemTooLarge(e)) {
        res.status(413).send(`sync data too large, max ${MAX_SYNC_PAYLOAD / 1024}KB`)
        return
      }
      throw e
    }
  } else {
    const data = await getData(dataId)
    res.send(data.data)
  }
}
