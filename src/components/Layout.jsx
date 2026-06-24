import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../context/CartContext'   // ← 路徑對應你 Layout 位置

function Layout() {
  const linkClass = ({ isActive }) =>
    `text-sm transition ${isActive ? 'text-black font-medium' : 'text-gray-500 hover:text-black'}`
  const { totalCount } = useCart()
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* 頂部導覽 */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight">CASEMOD</Link>
       <nav className="flex items-center gap-6">
            <NavLink to="/" className={linkClass} end>首頁</NavLink>
            <NavLink to="/collection" className={linkClass}>現成系列</NavLink>

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

            <Link to="/order" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition">
              開始設計
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      {/* 頁尾 */}
      <footer className="border-t border-gray-100 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <p className="font-bold tracking-tight">CASEMOD</p>
            <p className="text-sm text-gray-400 mt-1">專屬於你的相片手機殼</p>
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