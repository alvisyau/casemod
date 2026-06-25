import { NavLink } from 'react-router-dom'

function AdminNav() {
  const base = 'text-sm px-4 py-2 rounded-lg font-medium transition'
  const active = 'bg-black text-white'
  const idle = 'text-gray-500 hover:bg-gray-100'
  const cls = ({ isActive }) => `${base} ${isActive ? active : idle}`

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <div className="flex gap-2 flex-wrap">
        <NavLink to="/admin" end className={cls}>訂單</NavLink>
        <NavLink to="/admin/products" className={cls}>產品</NavLink>
        <NavLink to="/admin/collections" className={cls}>系列</NavLink>
        <NavLink to="/admin/settings" className={cls}>商店設定</NavLink>
      </div>
    </div>
  )
}

export default AdminNav