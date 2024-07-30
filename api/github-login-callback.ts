import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sign } from '../src/server/control/jwt'
import { handleGitHubLogin } from '../src/server/control/github-login'
import { User } from '../src/server/models/user-model'

export default async function githubLogin (req: VercelRequest, res: VercelResponse): Promise<void> {
  const {
    code, state
  } = req.query
  if (typeof code !== 'string') {
    res.status(400).send('code is required')
    return
  }
  const isAdmin = state === 'admin'
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
  localStorage.setItem('${tokenName}', '${token}');
  setTimeout(() => {
    window.location.href = '${redirectUrl}'
  }, 1000)
</script>

</body>
</html>
`
  res.send(html)
}
