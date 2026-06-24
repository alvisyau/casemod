import { NavLink } from 'react-router-dom'

function AdminNav() {
  const base = 'text-sm px-4 py-2 rounded-lg font-medium transition'
  const active = 'bg-black text-white'
  const idle = 'text-gray-500 hover:bg-gray-100'

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <div className="flex gap-2">
        <NavLink to="/admin" end className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
          訂單
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
          產品
        </NavLink>
<NavLink to="/admin/collections" className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
  系列
</NavLink>

      </div>
    </div>
  )
}

export default AdminNav