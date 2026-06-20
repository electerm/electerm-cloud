import logger from 'morgan'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import stylus from 'stylus'
import conf from './conf'
import route from './route'

// Import data for static pages
import {
  landingData,
  privacyData,
  agreementData,
  headerLinks,
  headerUrls,
  footerSections,
  siteMeta,
  consentText
} from '../../src/data'

const env = process.env
const cwd = process.cwd()
const viewPath = resolve(cwd, 'src/views')
const staticPath = resolve(cwd, 'src/static')
const devPort: number = env.SERVER_DEV_PORT != null && Number(env.SERVER_DEV_PORT) !== 0 ? Number(env.SERVER_DEV_PORT) : 5678
const host: string = env.SERVER_HOST ?? '127.0.0.1'
const h: string = `http://${host}:${devPort}`

console.log(encodeURIComponent(`http://127.0.0.1:${devPort}/api/github-login-callback`))

declare global {
  // eslint-disable-next-line no-var
  var viteInst: any
}

interface I18nText {
  en: string
  cn: string
  [key: string]: string
}

// Helper: get lang from URL path (/zh-cn prefix) or query string
function getLang (req: express.Request): string {
  if (req.path.startsWith('/zh-cn')) return 'cn'
  const q = req.query.lang
  if (q === 'cn' || q === 'en') return q as string
  return 'en'
}

// Helper: translate function for pug templates
function t (lang: string) {
  return function (obj: I18nText | undefined): string {
    if (!obj) return ''
    return obj[lang] ?? obj.en ?? ''
  }
}

// Common template data
function getCommonData (req: express.Request, cssUrl: string, canonicalPath: string) {
  const lang = getLang(req)
  return {
    lang,
    t: t(lang),
    headerLinks,
    headerUrls,
    footerSections,
    siteMeta,
    consentText,
    cssUrl,
    canonicalPath,
    canonicalUrl: siteMeta.baseUrl + canonicalPath,
    currentPath: canonicalPath
  }
}

// Compile Stylus to CSS
function compileMainCss (): string {
  const stylPath = resolve(cwd, 'src/styles/main.styl')
  const stylContent = readFileSync(stylPath, 'utf8')
  let css = ''
  stylus(stylContent)
    .set('filename', stylPath)
    .set('paths', [resolve(cwd, 'src/styles/partials')])
    .set('compress', true)
    .render((err, result) => {
      if (err) throw err
      css = result
    })
  return css
}

// Landing page handler
function handleLanding (req: express.Request, res: express.Response): void {
  const lang = getLang(req)
  const path = req.path
  const common = getCommonData(req, '/css/main.css', path)
  res.render('landing', {
    ...common,
    landingData,
    title: (landingData.meta.title as I18nText)[lang] ?? landingData.meta.title.en,
    description: (landingData.meta.description as I18nText)[lang] ?? landingData.meta.description.en,
    keywords: (landingData.meta.keywords as I18nText)[lang] ?? landingData.meta.keywords.en
  })
}

// Privacy page handler
function handlePrivacy (req: express.Request, res: express.Response): void {
  const lang = getLang(req)
  const common = getCommonData(req, '/css/main.css', req.path)
  res.render('privacy', {
    ...common,
    privacyData,
    title: (privacyData.meta.title as I18nText)[lang] ?? privacyData.meta.title.en,
    description: (privacyData.meta.description as I18nText)[lang] ?? privacyData.meta.description.en,
    keywords: ''
  })
}

// Agreement page handler
function handleAgreement (req: express.Request, res: express.Response): void {
  const lang = getLang(req)
  const common = getCommonData(req, '/css/main.css', req.path)
  res.render('agreement', {
    ...common,
    agreementData,
    title: (agreementData.meta.title as I18nText)[lang] ?? agreementData.meta.title.en,
    description: (agreementData.meta.description as I18nText)[lang] ?? agreementData.meta.description.en,
    keywords: ''
  })
}

// App page handler (moved from /)
function handleApp (req: express.Request, res: express.Response): void {
  res.render('index', {
    dev: true,
    cssUrl: '/app.bundle.css',
    jsUrl: '/src/client/entry/app.tsx',
    loginUrl: '',
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })
}

// Admin page handler
function handleAdmin (req: express.Request, res: express.Response): void {
  res.render('admin', {
    dev: true,
    cssUrl: '/admin.bundle.css',
    jsUrl: '/src/client/entry/admin.tsx',
    loginUrl: '',
    desc: 'electerm cloud: sync your electerm data to cloud',
    keywords: 'electerm, electerm-cloud',
    siteName: 'electerm cloud'
  })
}

async function createServer (): Promise<void> {
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
  app.set('views', viewPath)
  app.set('view engine', 'pug')

  // Static files from src/static
  app.use(express.static(staticPath))

  // Compiled SCSS endpoint for static pages
  app.get('/css/main.css', (_req, res) => {
    try {
      const css = compileMainCss()
      res.type('text/css')
      res.send(css)
    } catch (err) {
      console.error('SCSS compilation error:', err)
      res.status(500).send('CSS compilation error')
    }
  })

  // Static page routes (English)
  app.get('/', handleLanding)
  app.get('/privacy', handlePrivacy)
  app.get('/agreement', handleAgreement)

  // Static page routes (Chinese - /zh-cn prefix)
  app.get('/zh-cn', handleLanding)
  app.get('/zh-cn/privacy', handlePrivacy)
  app.get('/zh-cn/agreement', handleAgreement)

  // React app routes
  app.get('/app', handleApp)
  app.get('/admin', handleAdmin)

  // API routes
  route(app)

  // Vite middleware (HMR, source serving)
  app.use(vite.middlewares)

  app.listen(devPort, host, () => {
    console.log(`server started at ${h}`)
  })
}

void createServer()
