import logger from 'morgan'
import { resolve } from 'path'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import conf from './conf'
import route from './route'

const env = process.env
const cwd = process.cwd()
const viewPath = resolve(cwd, 'src/server/views')
const devPort: number = Number(env.SERVER_DEV_PORT) || 5678
const host: string = env.SERVER_HOST || '127.0.0.1'
const h: string = `http://${host}:${devPort}`
const cid = env.CLIENT_ID
const redirectUrl = encodeURIComponent(`http://127.0.0.1:${devPort}/api/github-login-callback`)

console.log(redirectUrl)

declare global {
  var viteInst: any
}

function handleIndex (req: express.Request, res: express.Response) {
  res.render('index', {
    dev: true,
    cssUrl: '/app.bundle.css',
    jsUrl: '/src/client/entry/app.tsx',
    loginUrl: `https://github.com/login/oauth/authorize?client_id=${cid}&redirect_uri=${redirectUrl}`
    ,
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })
}

function handleAdmin (req: express.Request, res: express.Response) {
  res.render('admin', {
    dev: true,
    cssUrl: '/admin.bundle.css',
    jsUrl: '/src/client/entry/admin.tsx',
    loginUrl: `https://github.com/login/oauth/authorize?client_id=${cid}&redirect_uri=${redirectUrl}&state=admin`
    ,
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })
}


async function createServer(): Promise<void> {
  const app: express.Application = express()
  const vite = await createViteServer({
    ...conf,
    server: {
      middlewareMode: true
    },
    appType: 'custom'
  })

  global.viteInst = vite

  app.use(logger('tiny'))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  // app.use(express.static(staticPath))
  app.set('views', viewPath)
  app.set('view engine', 'pug')

  app.get('/', handleIndex)
  app.get('/admin', handleAdmin)
  route(app)
  app.use(vite.middlewares)

  app.listen(devPort, host, () => {
    console.log(`server started at ${h}`)
  })
}

createServer()