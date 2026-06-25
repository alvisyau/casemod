import { useEffect } from 'react'
import { useBranding } from '../hooks/useBranding'

export default function FaviconManager() {
  const branding = useBranding()
  useEffect(() => {
    if (!branding?.favicon_url) return
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = branding.favicon_url
  }, [branding?.favicon_url])
  return null
}