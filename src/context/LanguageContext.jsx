import { createContext, useContext, useState, useCallback } from 'react'
import { translations, DEFAULT_LANG } from '../i18n/translations'

const LanguageContext = createContext(null)

function getInitialLang() {
  try {
    const saved = localStorage.getItem('lang')
    if (saved && translations[saved]) return saved
  } catch (e) { /* localStorage 可能唔可用 */ }
  return DEFAULT_LANG
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  const setLang = useCallback((l) => {
    if (!translations[l]) return
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch (e) { /* ignore */ }
  }, [])

  // t('home.title1') 咁用;搵唔到就 fallback 去預設語言,再搵唔到就回傳個 key
  const t = useCallback((key) => {
    const lookup = (dict) =>
      key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
    let val = lookup(translations[lang])
    if (val == null) val = lookup(translations[DEFAULT_LANG])
    return val == null ? key : val
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang 必須喺 LanguageProvider 入面用')
  return ctx
}