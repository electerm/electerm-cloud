import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId, decode } from '../src/server/control/jwt'
import { listTokens, delToken, reToken } from '../src/server/control/token'
import { getAllStatics } from '../src/server/control/statics'
import { UserModel } from '../src/server/models/db'
import { User } from '../src/server/models/user-model'

/**
 * Admin API - one serverless function (Vercel Hobby plan caps deployments at
 * 12 functions). Merges what used to be /api/get-admin-user,
 * /api/admin-tokens and /api/statics. Every path is gated by the admin JWT:
 *
 *   POST   /api/admin                       -> current admin user
 *   GET    /api/admin?fn=statics            -> usage statistics
 *   GET    /api/admin?fn=tokens&userId=x    -> list a user's sync tokens
 *   DELETE /api/admin?fn=tokens {userId,id} -> delete a user's token
 *   PATCH  /api/admin?fn=tokens {userId,id} -> regenerate a user's token
 *
 * Token ops reuse delToken/reToken, which still assert
 * token.userId === target.id, so an admin cannot mix up two users' tokens.
 */
export default async function admin (req: VercelRequest, res: VercelResponse): Promise<void> {
  const adminUser = await verifyJwtAndCheckId(req, res, true) as User
  if (adminUser === null) {
    return
  }
  const method = req.method ?? ''
  const fn = typeof req.query.fn === 'string' ? req.query.fn : ''

  if (method === 'POST' && fn === '') {
    res.setHeader('Cache-Control', 'private, no-store')
    res.send({
      user: {
        name: adminUser.name,
        email: adminUser.email,
        avatarUrl: adminUser.avatarUrl,
        githubLogin: adminUser.githubLogin
      }
    })
    return
  }

  if (method === 'GET' && fn === 'statics') {
    try {
      const statistics = await getAllStatics()
      res.status(200).json(statistics)
    } catch (err) {
      console.log(err)
      res.status(500).send('Internal server error')
    }
    return
  }

  if (fn !== 'tokens') {
    res.status(404).send('404 not found')
    return
  }

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
