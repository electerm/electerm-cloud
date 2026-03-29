import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { sign } from '../src/server/control/jwt'
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
  const token = sign((user as User).id)
  const tokenName = isAdmin ? 'adminToken' : 'token'
  const redirectUrl = isAdmin ? '/admin' : '/'
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirect</title>
</head>
<body>
<div style="text-align: center; padding: 30px 10px;">Loading...</div>
<script>
  localStorage.setItem(${JSON.stringify(tokenName)}, ${JSON.stringify(token)});
  setTimeout(() => {
    window.location.href = ${JSON.stringify(redirectUrl)}
  }, 1000)
</script>

</body>
</html>
`
  res.send(html)
}
