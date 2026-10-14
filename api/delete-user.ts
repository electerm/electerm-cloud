import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'
import { delUser } from '../src/server/control/admin-users'
import { User } from '../src/server/models/user-model'

export default async function deleteUser (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res) as User
  if (user === null) {
    return
  }
  try {
    // cascade delete: data + tokens + user
    await delUser(user.id)
    res.send({
      ok: true
    })
  } catch (err) {
    console.log(err)
    res.status(500).send((err as Error).message)
  }
}
