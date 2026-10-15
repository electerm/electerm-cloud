import type { VercelRequest, VercelResponse } from '@vercel/node'
import { updateData, getData } from '../src/server/control/data-control'
import { verifyJwt } from '../src/server/control/jwt'
import { getToken } from '../src/server/control/token'
import { UserModel } from '../src/server/models/db'
import {
  MAX_SYNC_PAYLOAD,
  MAX_SYNC_PAYLOAD_KB,
  SYNC_WARN_RATIO,
  TOO_LARGE_MSG,
  isItemTooLarge,
  isThrottled,
  payloadBytes,
  storedItemBytes
} from '../src/server/control/sync-limits'

// Published on every response so a client can learn the limit instead of
// hardcoding it. electerm's own pre-check still carries a copy of the number
// (it has to warn before it has ever talked to the server), so keep both in
// step when this changes.
function publishLimits (res: VercelResponse): void {
  res.setHeader('X-Sync-Max-KB', String(MAX_SYNC_PAYLOAD_KB))
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
  publishLimits(res)
  if (method === 'POST') {
    res.send('test ok')
    return
  }
  if (method === 'PUT') {
    const payload = JSON.stringify(req.body)
    const bytes = payloadBytes(payload)
    if (bytes > MAX_SYNC_PAYLOAD) {
      res.status(413).send(TOO_LARGE_MSG)
      return
    }
    // Size of the row this will become, known before the write is attempted.
    // Reported so the client can warn on the *next* sync rather than the user
    // discovering it as a failure.
    const itemKB = Math.ceil(storedItemBytes(payload) / 1024)
    res.setHeader('X-Sync-Item-KB', String(itemKB))
    if (bytes > MAX_SYNC_PAYLOAD * SYNC_WARN_RATIO) {
      res.setHeader('X-Sync-Warn', 'payload-near-limit')
    }
    try {
      const data = await updateData(dataId, payload)
      res.send(data)
    } catch (e) {
      if (isItemTooLarge(e)) {
        res.status(413).send(TOO_LARGE_MSG)
        return
      }
      if (isThrottled(e)) {
        // The write itself was fine; the table's provisioned write capacity
        // was not. Name both numbers so the message is actionable rather than
        // another anonymous 500 — this is the error users were hitting.
        res.status(429).send(
          `sync server busy, stored ${itemKB}KB of ${MAX_SYNC_PAYLOAD_KB}KB max, retry later`
        )
        return
      }
      throw e
    }
  } else {
    const data = await getData(dataId)
    res.send(data.data)
  }
}
