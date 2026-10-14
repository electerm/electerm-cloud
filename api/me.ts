import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'
import { delUser } from '../src/server/control/admin-users'
import { User } from '../src/server/models/user-model'

/**
 * Current-user API - one serverless function. Merges what used to be
 * /api/get-user and /api/delete-user:
 *
 *   GET    /api/me -> the logged-in user's public profile
 *   DELETE /api/me -> delete own account (cascade: data + tokens + user)
 */
export default async function me (req: VercelRequest, res: VercelResponse): Promise<void> {
  const method = req.method ?? ''
  if (method !== 'GET' && method !== 'DELETE') {
    res.status(404).send('404 not found')
    return
  }
  const user = await verifyJwtAndCheckId(req, res) as User
  if (user === null) {
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  if (method === 'DELETE') {
    try {
      // cascade delete: data + tokens + user
      await delUser(user.id)
      res.send({
        ok: true
      })
    } catch (err) {
      console.log(err)
      res.status(500).send('Internal server error')
    }
    return
  }
  if (process.env.STOP_SERVICE_MSG !== undefined) {
    res.status(503).send(process.env.STOP_SERVICE_MSG)
    return
  }
  if (user.status === 'disabled') {
    res.status(403).send('user disabled')
    return
  }
  res.send({
    user: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      githubLogin: user.githubLogin
    }
  })
}
