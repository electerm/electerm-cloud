import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sign } from '../src/server/control/jwt'
import { handleGoogleLogin } from '../src/server/control/google-login'
import { User } from '../src/server/models/user-model'

export default async function googleLogin (req: VercelRequest, res: VercelResponse): Promise<void> {
  const {
    code
  } = req.query
  if (typeof code !== 'string') {
    res.status(400).send('code is required')
    return
  }
  const user = await handleGoogleLogin(code)
    .catch((err: Error) => {
      console.log(err)
      res.status(500).send('google login error: ' + err.message)
      return false
    })
    .then((r: User | false) => r)
  if (user === false) {
    return
  }
  const token = sign(user.id)
  const tokenName = 'token'
  const redirectUrl = '/'
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
