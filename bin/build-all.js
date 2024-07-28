
import { buildPug } from './build-bug.js'
import { resolve } from 'path'
import { cwd, env } from './common.js'

async function main () {
  const from = resolve(cwd, 'src/views/index.pug')
  const to = resolve(cwd, 'public/index.html')
  const cid = env.GITHUB_CLIENT_ID_PROD
  const redirectUrl = encodeURIComponent('http://electerm-cloud.html5beta.com/api/github-login-callback')

  await buildPug(from, to, {
    dev: false,
    cssUrl: '/css/app.bundle.css',
    jsUrl: '/js/app.bundle.js',
    loginUrl: `https://github.com/login/oauth/authorize?client_id=${cid}&redirect_uri=${redirectUrl}`,
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })
}

main()
