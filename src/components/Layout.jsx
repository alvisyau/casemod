import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LanguageContext'
import { LANGUAGES } from '../i18n/translations'
import BrandLogo from './BrandLogo'

function Layout() {
  const { lang, setLang, t } = useLang()
  const linkClass = ({ isActive }) =>
    `text-sm transition ${isActive ? 'text-black font-medium' : 'text-gray-500 hover:text-black'}`
  const { totalCount } = useCart()

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* 頂部導覽 */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 h-24 flex items-center justify-between">
          <BrandLogo />
          <nav className="flex items-center gap-3 sm:gap-5">
            <NavLink to="/" className={linkClass} end>{t('nav.home')}</NavLink>
            <NavLink to="/collection" className={linkClass}>{t('nav.collection')}</NavLink>

            <Link to="/order" className="px-4 py-2 rounded-lg  text-black text-sm font-medium  transition">
              {t('nav.startDesign')}
            </Link>
            {/* 購物車 */}
            <Link to="/cart" className="relative p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>


            {/* ⭐ 語言切換 */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2 py-1 text-xs transition ${
                    lang === l.code ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      {/* 頁尾 */}
      <footer className="border-t border-gray-100 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <p className="font-bold tracking-tight">CASEMOD</p>
            <p className="text-sm text-gray-400 mt-1">{t('footer.tagline')}</p>
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <p>WhatsApp · Instagram · WeChat</p>
            <p>© {new Date().getFullYear()} Casemod</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout