export function getBrowserLanguage (): string {
  const defaultLanguage = 'en' // Default to English if detection fails

  if (typeof window === 'undefined') {
    return defaultLanguage // Return default if not in browser environment
  }

  // Get the browser's language
  const browserLang = window.navigator.language || (navigator as any).userLanguage

  if (!browserLang) {
    return defaultLanguage
  }

  // Get the first two characters of the language code (e.g., 'en-US' becomes 'en')
  const langCode = browserLang.split('-')[0].toLowerCase()

  // Add your supported languages here
  const supportedLanguages = ['en', 'cn']

  // Check if the detected language is supported, otherwise return default
  return supportedLanguages.includes(langCode) ? langCode : defaultLanguage
}
