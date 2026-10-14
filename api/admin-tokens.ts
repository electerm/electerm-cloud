import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId, decode } from '../src/server/control/jwt'
import { listTokens, delToken, reToken } from '../src/server/control/token'
import { UserModel } from '../src/server/models/db'
import { User } from '../src/server/models/user-model'

/**
 * Admin token management: lets an admin (verified by admin JWT) list, delete
 * and regenerate any user's sync tokens. Replaces the raw dbOperation
 * backdoor: every operation is typed and scoped to a target user, and
 * delToken/reToken still enforce token.userId === target.id, so an admin
 * cannot mix up two users' tokens.
 */
export default async function adminTokens (req: VercelRequest, res: VercelResponse): Promise<void> {
  const admin = await verifyJwtAndCheckId(req, res, true) as User
  if (admin === null) {
    return
  }
  const {
    method
  } = req
  const userId = (method === 'GET' ? req.query.userId : req.body?.userId) as string | undefined
  if (typeof userId !== 'string' || userId === '') {
    res.status(400).send('userId is required')
    return
  }
  const target = await UserModel.get({ id: userId })
  if (target === undefined || target === null) {
    res.status(404).send('user not found')
    return
  }

  function handleError (err: Error): void {
    console.log(err)
    if (err.message === 'Token not found or access denied') {
      res.status(403).send(err.message)
      return
    }
    res.status(500).send('Internal server error')
  }

  if (method === 'GET') {
    const ids = target.tokenIds.split(',')
    await listTokens(ids)
      .then(tokens => {
        res.send({
          tokens
        })
      })
      .catch(handleError)
    return
  }

  const { id } = req.body
  if (typeof id !== 'string' || id === '') {
    res.status(400).send('token id is required')
    return
  }
  let tokenId = ''
  try {
    tokenId = decode(id)
  } catch {
    res.status(400).send('Invalid token id')
    return
  }
  if (method === 'DELETE') {
    await delToken(tokenId, target)
      .then(() => {
        res.send({
          ok: true
        })
      })
      .catch(handleError)
  } else if (method === 'PATCH') {
    await reToken(tokenId, target)
      .then(token => {
        res.send({
          token
        })
      })
      .catch(handleError)
  } else {
    res.status(404).send('404 not found')
  }
}
