import type { VercelRequest, VercelResponse } from '@vercel/node'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import pug from 'pug'
import {
  headerLinks,
  headerUrls,
  footerSections,
  siteMeta
} from '../src/data/common'

interface I18nText {
  en: string
  cn: string
  [key: string]: string
}

const notFoundData: {
  title: I18nText
  description: I18nText
  backHome: I18nText
} = {
  title: { en: 'Page Not Found', cn: '页面未找到' },
  description: {
    en: 'The page you are looking for does not exist or has been moved.',
    cn: '您查找的页面不存在或已被移动。'
  },
  backHome: { en: 'Back to Home', cn: '返回首页' }
}

function t (lang: string) {
  return function (obj: I18nText | undefined): string {
    if (obj === undefined) return ''
    return obj[lang] ?? obj.en ?? ''
  }
}

export default async function notFound (req: VercelRequest, res: VercelResponse): Promise<void> {
  const url = req.url ?? '/'
  const lang = url.startsWith('/zh-cn') ? 'cn' : 'en'
  const canonicalPath = url

  const templatePath = resolve(process.cwd(), 'src/views/404.pug')
  const template = readFileSync(templatePath, 'utf8')

  const html = pug.render(template, {
    filename: templatePath,
    lang,
    t: t(lang),
    headerLinks,
    headerUrls,
    footerSections,
    siteMeta,
    cssUrl: '/css/main.css',
    canonicalPath,
    canonicalUrl: siteMeta.baseUrl + canonicalPath,
    currentPath: canonicalPath,
    title: lang === 'cn' ? '404 - 页面未找到' : '404 - Page Not Found',
    description: notFoundData.description[lang] ?? notFoundData.description.en,
    keywords: '404, not found, electerm, electerm-cloud',
    notFoundData
  })

  res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}
