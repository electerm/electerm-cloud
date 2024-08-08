import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'
import { User } from '../src/server/models/user-model'

export default async function getUser (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res) as User
  if (user === null) {
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
