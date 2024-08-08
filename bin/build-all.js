
const { buildPug } = require('./build-bug.js')
const { resolve } = require('path')
const { cwd, env } = require('./common.js')
const { mkdirSync } = require('fs')

async function main () {
  const from = resolve(cwd, 'src/server/views/index.pug')
  const to = resolve(cwd, 'public/index.html')
  const cid = env.GITHUB_CLIENT_ID_PROD
  const redirectUrl = encodeURIComponent('http://electerm-cloud.html5beta.com/api/github-login-callback')

  await buildPug(from, to, {
    dev: false,
    cssUrl: '/css/style.css',
    jsUrl: '/js/app.bundle.js',
    loginUrl: `https://github.com/login/oauth/authorize?client_id=${cid}&redirect_uri=${redirectUrl}`,
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })

  const from1 = resolve(cwd, 'src/server/views/admin.pug')
  const to1 = resolve(cwd, 'public/admin/index.html')
  mkdirSync(
    resolve(cwd, 'public/admin'),
    { recursive: true }
  )

  await buildPug(from1, to1, {
    dev: false,
    cssUrl: '/css/style.css',
    jsUrl: '/js/admin.bundle.js',
    loginUrl: `https://github.com/login/oauth/authorize?client_id=${cid}&redirect_uri=${redirectUrl}&state=admin`,
    desc: 'electerm cloud admin: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud admin'
  })
}

main()
