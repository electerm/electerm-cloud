import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkCsrf, clearSessionCookies } from '../src/server/control/session'

export default async function logoutHandler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(404).send('404 not found')
    return
  }
  // a cookie session must pass the same CSRF gate as other writes, so a
  // third-party page cannot force-logout a logged-in browser
  if (!checkCsrf(req, res)) {
    return
  }
  clearSessionCookies(req, res)
  res.setHeader('Cache-Control', 'private, no-store')
  res.send({ ok: true })
}
