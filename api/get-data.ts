import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'
import { getData } from '../src/server/control/data-control'

export default async function getDataRoute (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res)
  if (user === null) {
    return
  }
  const {
    id
  } = req.body
  if (!user.dataIds.includes(id)) {
    res.status(403).send('data id not match')
    return
  }
  const data = await getData(id)
  res.send({
    text: data.data
  })
}
