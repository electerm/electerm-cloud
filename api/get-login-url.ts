import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET ?? ''
const clientId = process.env.CLIENT_ID ?? process.env.CLIENT_ID_PROD ?? ''
const prodHost = process.env.PROD_HOST ?? 'https://electerm-cloud.html5beta.com'

export default async function getLoginUrl (req: VercelRequest, res: VercelResponse): Promise<void> {
  const isAdmin = req.query.isAdmin === 'true'
  const state = jwt.sign(
    { isAdmin, nonce: Math.random().toString(36).slice(2) },
    jwtSecret,
    { expiresIn: '10m' }
  )
  const host = process.env.NODE_ENV === 'production' ? prodHost : `http://127.0.0.1:${process.env.SERVER_DEV_PORT ?? '5678'}`
  const redirectUrl = encodeURIComponent(`${host}/api/github-login-callback`)
  const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&state=${encodeURIComponent(state)}`
  res.json({ loginUrl })
}
