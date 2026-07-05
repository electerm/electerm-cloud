require('dotenv').config()
const { buildPug } = require('./build-bug.js')
const { resolve } = require('path')
const { cwd } = require('./common.js')
const { mkdirSync } = require('fs')

async function main () {
  // Build /app page (React app, moved from /)
  const from = resolve(cwd, 'src/views/index.pug')
  const to = resolve(cwd, 'public/app/index.html')
  mkdirSync(resolve(cwd, 'public/app'), { recursive: true })

  await buildPug(from, to, {
    dev: false,
    cssUrl: '/css/style.css',
    jsUrl: '/js/app.bundle.js',
    loginUrl: '',
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })
  console.log('  ✓ public/app/index.html')

  // Build /admin page
  const from1 = resolve(cwd, 'src/views/admin.pug')
  const to1 = resolve(cwd, 'public/admin/index.html')
  mkdirSync(
    resolve(cwd, 'public/admin'),
    { recursive: true }
  )

  await buildPug(from1, to1, {
    dev: false,
    cssUrl: '/css/style.css',
    jsUrl: '/js/admin.bundle.js',
    loginUrl: '',
    desc: 'electerm cloud admin: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud admin'
  })
  console.log('  ✓ public/admin/index.html')

  // Also keep a redirect at old root for backwards compatibility
  // This is handled by vercel.json rewrites instead
}

main().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
