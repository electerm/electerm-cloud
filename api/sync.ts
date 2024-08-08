import type { VercelRequest, VercelResponse } from '@vercel/node'
import { updateData, getData } from '../src/server/control/data-control'
import { verifyJwt } from '../src/server/control/jwt'
import { getToken } from '../src/server/control/token'

export default async function syncHandler (req: VercelRequest, res: VercelResponse): Promise<void> {
  const {
    method = ''
  } = req
  const arr = ['GET', 'PUT', 'POST']
  if (!arr.includes(method)) {
    res.status(404).send('404 not found')
    return
  }
  if (method === 'POST') {
    res.send('test ok')
    return
  }
  const id = await verifyJwt(req, res)
  console.log('id', id)
  if (id === null) {
    return
  }
  const token = await getToken(id)
  const { dataId } = token
  if (method === 'PUT') {
    const data = await updateData(dataId, JSON.stringify(req.body))
    res.send(data)
  } else {
    const data = await getData(dataId)
    res.send(data)
  }
}
