import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'
import { listUsers, delUser, updateUser } from '../src/server/control/admin-users'
import { User } from '../src/server/models/user-model'

export default async function userHandler (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res, true) as User
  if (user === null) {
    return
  }
  const {
    method
  } = req
  const {
    id,
    update
  } = req.body
  function handleError (err: Error): void {
    console.log(err)
    res.status(500).send(err.message)
  }
  if (method === 'GET') {
    const start = req.query.start as string ?? ''
    const limit = Number(req.query.limit as string ?? 10)
    const result = await listUsers(start, limit).catch(handleError)
    res.send(result)
    return
  }
  if (method === 'DELETE') {
    await delUser(id).catch(handleError)
    res.send({
      ok: true
    })
  } else if (method === 'PATCH') {
    const token = await updateUser(id, update).catch(handleError)
    res.send({
      token
    })
  } else {
    res.status(404).send('404 not found')
  }
}
