import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'
import { getData } from '../src/server/control/data-control'
import { User } from '../src/server/models/user-model'

export default async function getDataRoute (req: VercelRequest, res: VercelResponse): Promise<void> {
  const user = await verifyJwtAndCheckId(req, res) as User
  if (user === null) {
    return
  }
  const {
    id
  } = req.body
  // exact membership check: dataIds is a comma-joined list, and a substring
  // matches like "abc" against "xabc,y" would pass an includes() test
  if (typeof id !== 'string' || !user.dataIds.split(',').includes(id)) {
    res.status(403).send('data id not match')
    return
  }
  const data = await getData(id)
  res.send({
    text: data.data
  })
}
