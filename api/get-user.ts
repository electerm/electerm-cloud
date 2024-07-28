import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'

export default async function getUser (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res)
  if (user === null) {
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
