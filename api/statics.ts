import { VercelRequest, VercelResponse } from '@vercel/node'
import { getAllStatics } from '../src/server/control/statics'
import { verifyJwtAndCheckId } from '../src/server/control/jwt'

export default async function statics (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed')
    return
  }

  const user = await verifyJwtAndCheckId(req, res, true)
  if (user === null) {
    return
  }

  await getAllStatics()
    .catch((err) => {
      console.log(err)
      res.status(500).send(err.message)
    })
    .then((statistics) => {
      res.status(200).json(statistics)
    })
}
