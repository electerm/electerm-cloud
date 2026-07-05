export interface LinkItem {
  url: string
  title: Record<string, string>
}

export interface LangData {
  lang: string
  langName: string
}

export const langs: LangData[] = [
  { lang: 'en', langName: 'English' },
  { lang: 'cn', langName: '中文' }
]

export const headerLinks = {
  desktop: {
    en: 'Desktop App',
    cn: '桌面应用'
  },
  online: {
    en: 'Electerm Online',
    cn: 'Electerm 在线版'
  },
  github: {
    en: 'GitHub',
    cn: 'GitHub'
  }
}

export const headerUrls = {
  desktop: 'https://electerm.org',
  online: 'https://cloud.electerm.org',
  github: 'https://github.com/electerm/electerm'
}

export const footerSections = {
  product: {
    title: { en: 'Product', cn: '产品' },
    links: [
      { url: 'https://electerm.org', title: { en: 'Download', cn: '下载' } },
      { url: 'https://cloud.electerm.org', title: { en: 'Electerm Online', cn: 'Electerm 在线版' } },
      { url: 'https://electerm.org/videos', title: { en: 'Video Guides', cn: '视频教程' } },
      { url: 'https://github.com/electerm/electerm/wiki', title: { en: 'Documentation', cn: '文档' } },
      { url: 'https://electerm.org/sponsor-electerm/', title: { en: 'Sponsor', cn: '赞助' } }
    ]
  },
  community: {
    title: { en: 'Community', cn: '社区' },
    links: [
      { url: 'https://github.com/electerm/electerm', title: { en: 'GitHub', cn: 'GitHub' } },
      { url: 'https://github.com/electerm/electerm/discussions', title: { en: 'Discussions', cn: '讨论' } },
      { url: 'https://github.com/electerm/electerm/issues', title: { en: 'Report Issues', cn: '报告问题' } },
      { url: 'https://github.com/electerm/electerm-locales', title: { en: 'Translations', cn: '翻译' } }
    ]
  },
  related: {
    title: { en: 'Related', cn: '相关项目' },
    links: [
      { url: 'https://electerm.org', title: { en: 'electerm', cn: 'electerm' } },
      { url: 'https://github.com/electerm/electerm-web', title: { en: 'electerm-web', cn: 'electerm-web' } },
      { url: 'https://github.com/electerm/electerm-web-docker', title: { en: 'electerm-web-docker', cn: 'electerm-web-docker' } }
    ]
  }
}

export const siteMeta = {
  domain: 'sync.electerm.org',
  baseUrl: 'https://sync.electerm.org',
  author: 'ZHAO Xudong',
  copyright: '© 2024 ZHAO Xudong. MIT License.'
}
