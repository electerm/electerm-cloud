import type { VercelRequest, VercelResponse } from '@vercel/node'
import auth from 'basic-auth'
import { dbOperation } from '../src/server/control/admin'

export default async function admin (req: VercelRequest, res: VercelResponse): Promise<void> {
  // Basic Auth verification
  const credentials = auth(req)

  if (
    credentials === undefined ||
    credentials.name !== process.env.ADMIN_USER ||
    credentials.pass !== process.env.ADMIN_PASS
  ) {
    res.status(401).setHeader('WWW-Authenticate', 'Basic realm="Admin Area"')
    res.send('Unauthorized: Invalid credentials')
    return
  }

  // Extract parameters from request
  const { func, params, tableName = 'AdminUser' } = req.body

  if (func === undefined || !Array.isArray(params)) {
    res.status(400).send('Bad Request: tableName and params are required')
    return
  }

  // Call dbOperation from control/admin.ts
  const result = await dbOperation(tableName, func, params)
    .catch((err) => {
      console.log(err)
      res.status(500).send(err.message)
    })
  if (result === undefined) {
    return
  }
  res.status(200).send(result)
}
