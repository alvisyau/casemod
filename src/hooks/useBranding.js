import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

let cache = null  // 模組級 cache,跨頁面共用

export function useBranding() {
  const [branding, setBranding] = useState(cache || {})

  useEffect(() => {
    let alive = true
    supabase
      .from('store_settings').select('value').eq('key', 'branding').single()
      .then(({ data }) => {
        if (!alive) return
        cache = data?.value || {}
        setBranding(cache)
      })
    return () => { alive = false }
  }, [])

  return branding
}