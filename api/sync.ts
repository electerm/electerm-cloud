import type { VercelRequest, VercelResponse } from '@vercel/node'
import { updateData, getData } from '../src/server/control/data-control'
import { verifyJwt } from '../src/server/control/jwt'
import { getToken } from '../src/server/control/token'
import { UserModel } from '../src/server/models/db'

// DynamoDB caps a stored item at 400KB. The electerm client encrypts
// bookmarks/profiles with aes-256-gcm before upload, which roughly doubles
// the payload (hex encoding + iv/salt/tag framing), so data that used to fit
// can now exceed the limit and fail with an opaque 500. Reject early with a
// clear message instead.
const MAX_SYNC_PAYLOAD = 350 * 1024

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
    const data = await updateData(dataId, payload)
    res.send(data)
  } else {
    const data = await getData(dataId)
    res.send(data.data)
  }
}
