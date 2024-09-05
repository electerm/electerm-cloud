import { cn } from './cn'
import { en } from './en'

export function getBrowserLanguage (): string {
  const defaultLanguage = 'en-US' // Default to English if detection fails

  if (typeof window === 'undefined') {
    return defaultLanguage // Return default if not in browser environment
  }

  // Get the browser's language
  const browserLang = window.navigator.language ?? defaultLanguage

  // Get the first two characters of the language code (e.g., 'en-US' becomes 'en')
  const langCode = browserLang.split('-')[0].toLowerCase()

  // Add your supported languages here
  const supportedLanguages = ['en', 'cn']

  // Check if the detected language is supported, otherwise return default
  return supportedLanguages.includes(langCode) ? langCode : defaultLanguage
}

export function getLang (): string {
  const {
    lang,
    localStorage
  } = window as any
  if (lang !== undefined) {
    return lang
  }
  let langLs = localStorage.getItem('lang')
  if (langLs !== null) {
    ;(window as any).lang = langLs
    return langLs
  }
  langLs = getBrowserLanguage()
  localStorage.setItem('lang', langLs)
  ;(window as any).lang = langLs
  return lang
}

export function t (key: string): string {
  const lang = getLang()
  const obj = lang === 'en' ? en : cn
  return obj[key] ?? key
}
