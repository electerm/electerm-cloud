import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { checkCsrf, clearSessionCookies } from '../src/server/control/session'

const jwtSecret = process.env.JWT_SECRET ?? ''
const clientId = process.env.CLIENT_ID ?? process.env.CLIENT_ID_PROD ?? ''
const prodHost = process.env.PROD_HOST ?? 'https://sync.electerm.org'

/**
 * Auth helper API - one serverless function. Merges what used to be
 * /api/get-login-url and /api/logout. The OAuth callback itself stays at
 * /api/github-login-callback: that URL is registered in the GitHub OAuth
 * app, so moving it would break login until the app config is updated.
 *
 *   GET  /api/auth?fn=login-url[&isAdmin=true] -> GitHub login URL + state
 *   POST /api/auth?fn=logout                   -> clear session cookies
 */
export default async function auth (req: VercelRequest, res: VercelResponse): Promise<void> {
  const method = req.method ?? ''
  const fn = typeof req.query.fn === 'string' ? req.query.fn : ''

  if (fn === 'login-url' && method === 'GET') {
    const isAdmin = req.query.isAdmin === 'true'
    const state = jwt.sign(
      { isAdmin, nonce: Math.random().toString(36).slice(2) },
      jwtSecret,
      { expiresIn: '10m' }
    )
    const host = process.env.NODE_ENV === 'production' ? prodHost : `http://127.0.0.1:${process.env.SERVER_DEV_PORT ?? '5678'}`
    const redirectUrl = encodeURIComponent(`${host}/api/github-login-callback`)
    const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&state=${encodeURIComponent(state)}`
    res.setHeader('Cache-Control', 'private, no-store')
    res.json({ loginUrl })
    return
  }

  if (fn === 'logout' && method === 'POST') {
    // a cookie session must pass the same CSRF gate as other writes, so a
    // third-party page cannot force-logout a logged-in browser
    if (!checkCsrf(req, res)) {
      return
    }
    clearSessionCookies(req, res)
    res.setHeader('Cache-Control', 'private, no-store')
    res.send({ ok: true })
    return
  }

  res.status(404).send('404 not found')
}
