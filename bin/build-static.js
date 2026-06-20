/**
 * Build static pages (landing, privacy, agreement) and CSS
 * Also generates sitemap.xml
 *
 * Usage: npx tsx bin/build-static.js
 * (Requires tsx for TypeScript imports)
 */
require('dotenv').config()
const { buildPug } = require('./build-bug.js')
const { resolve } = require('path')
const { cwd } = require('./common.js')
const { mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync } = require('fs')
const stylus = require('stylus')

// Import data (TypeScript files loaded via tsx)
const dataPath = resolve(cwd, 'src/data/index.ts')
const {
  landingData,
  privacyData,
  agreementData,
  headerLinks,
  headerUrls,
  footerSections,
  siteMeta,
  consentText
} = require(dataPath)

// Helper: translate function factory
function t (lang) {
  return function (obj) {
    if (!obj) return ''
    return obj[lang] ?? obj.en ?? ''
  }
}

// Common template data
function getCommonData (cssUrl, canonicalPath) {
  const lang = 'en'
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

// Compile Stylus
function buildCss () {
  const stylPath = resolve(cwd, 'src/styles/main.styl')
  const cssDir = resolve(cwd, 'public/css')
  mkdirSync(cssDir, { recursive: true })
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
  writeFileSync(resolve(cssDir, 'main.css'), css, 'utf8')
  console.log('  ✓ public/css/main.css')
}

// Build a static page for both en and cn
// dataKey is the variable name used in pug (e.g., 'landingData')
// pageData is the actual data object (e.g., landingData)
async function buildStaticPage (templateName, dataKey, pageData, outDir, canonicalPath) {
  const from = resolve(cwd, `src/views/${templateName}.pug`)
  const pageMeta = pageData.meta

  // English version (root)
  const toEn = resolve(cwd, `public/${outDir}/index.html`)
  mkdirSync(resolve(cwd, `public/${outDir}`), { recursive: true })
  const commonEn = getCommonData('/css/main.css', canonicalPath)
  await buildPug(from, toEn, {
    ...commonEn,
    [dataKey]: pageData,
    title: pageMeta.title.en,
    description: pageMeta.description.en,
    keywords: pageMeta.keywords ? pageMeta.keywords.en : ''
  })
  console.log(`  ✓ public/${outDir}/index.html (en)`)

  // Chinese version
  const toCn = resolve(cwd, `public/${outDir}/cn/index.html`)
  mkdirSync(resolve(cwd, `public/${outDir}/cn`), { recursive: true })
  const commonCn = { ...getCommonData('/css/main.css', canonicalPath), lang: 'cn', t: t('cn') }
  await buildPug(from, toCn, {
    ...commonCn,
    [dataKey]: pageData,
    title: pageMeta.title.cn ?? pageMeta.title.en,
    description: pageMeta.description.cn ?? pageMeta.description.en,
    keywords: pageMeta.keywords ? (pageMeta.keywords.cn ?? pageMeta.keywords.en) : ''
  })
  console.log(`  ✓ public/${outDir}/cn/index.html (cn)`)
}

// Generate sitemap.xml
function buildSitemap () {
  const pages = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
    { path: '/agreement', changefreq: 'monthly', priority: '0.5' },
    { path: '/cn/', changefreq: 'weekly', priority: '0.8' },
    { path: '/privacy/cn/', changefreq: 'monthly', priority: '0.4' },
    { path: '/agreement/cn/', changefreq: 'monthly', priority: '0.4' }
  ]

  const urls = pages.map(p => `  <url>
    <loc>${siteMeta.baseUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  writeFileSync(resolve(cwd, 'public/sitemap.xml'), xml, 'utf8')
  console.log('  ✓ public/sitemap.xml')
}

// Copy static files
function copyStaticFiles () {
  const staticDir = resolve(cwd, 'src/static')
  const publicDir = resolve(cwd, 'public')
  const files = ['robots.txt', 'ai.txt']
  files.forEach(f => {
    const src = resolve(staticDir, f)
    if (existsSync(src)) {
      copyFileSync(src, resolve(publicDir, f))
      console.log(`  ✓ public/${f}`)
    }
  })
}

// Copy favicon files
function copyFavicons () {
  const staticDir = resolve(cwd, 'src/static')
  const publicDir = resolve(cwd, 'public')
  const favicons = ['favicon.ico', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png']
  favicons.forEach(f => {
    const src = resolve(staticDir, f)
    if (existsSync(src)) {
      copyFileSync(src, resolve(publicDir, f))
      console.log(`  ✓ public/${f}`)
    }
  })
}

async function main () {
  console.log('\nBuilding static pages...\n')

  // Compile CSS
  buildCss()

  // Build static pages
  await buildStaticPage('landing', 'landingData', landingData, '', '/')
  await buildStaticPage('privacy', 'privacyData', privacyData, 'privacy', '/privacy')
  await buildStaticPage('agreement', 'agreementData', agreementData, 'agreement', '/agreement')

  // Generate sitemap
  buildSitemap()

  // Copy static files
  copyStaticFiles()
  copyFavicons()

  console.log('\nStatic pages build complete!\n')
}

main().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
