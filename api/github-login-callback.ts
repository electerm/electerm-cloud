import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { sign } from '../src/server/control/jwt'
import { generateCsrfToken, setCsrfCookie, setSessionCookie } from '../src/server/control/session'
import { handleGitHubLogin } from '../src/server/control/github-login'
import { User } from '../src/server/models/user-model'

const jwtSecret = process.env.JWT_SECRET ?? ''

export default async function githubLogin (req: VercelRequest, res: VercelResponse): Promise<void> {
  const {
    code, state
  } = req.query
  if (typeof code !== 'string' || typeof state !== 'string') {
    res.status(400).send('code and state are required')
    return
  }
  let isAdmin = false
  try {
    const payload = jwt.verify(state, jwtSecret) as { isAdmin?: boolean }
    isAdmin = payload.isAdmin === true
  } catch {
    res.status(403).send('Invalid or expired state parameter')
    return
  }
  const user = await handleGitHubLogin(code, isAdmin)
    .catch((err) => {
      console.log(err)
      res.status(500).send('github login error: ' + (err as Error).message)
      return false
    })
    .then(r => r)
  if (user === false) {
    return
  }
  // Browser channel: session JWT in an httpOnly cookie (never touches JS),
  // plus a readable csrf cookie for double-submit on writes. No more inline
  // script writing the token into localStorage.
  const token = sign((user as User).id)
  setSessionCookie(req, res, token)
  setCsrfCookie(req, res, generateCsrfToken())
  const redirectUrl = isAdmin ? '/admin' : '/app'
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(302)
  res.setHeader('Location', redirectUrl)
  res.end()
}
