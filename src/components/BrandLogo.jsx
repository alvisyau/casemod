import { Link } from 'react-router-dom'
import { useBranding } from '../hooks/useBranding'

export default function BrandLogo({ className = '' }) {
  const branding = useBranding()

  if (branding?.header_logo_url) {
    return (
      <Link to="/" className={`inline-flex items-center ${className}`}>
        <img src={branding.header_logo_url} alt="CaseMod"
          className="h-24 w-auto object-contain" />
      </Link>
    )
  }

  return (
    <Link to="/" className={`text-lg font-bold tracking-tight ${className}`}>
      CASEMOD
    </Link>
  )
}