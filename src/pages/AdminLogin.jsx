import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useBranding } from '../hooks/useBranding'

function AdminLogin() {
  const navigate = useNavigate()
  const { login_logo_url: loginLogo } = useBranding()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

// 已登入 + 係 admin 先入後台
useEffect(() => {
  supabase.auth.getSession().then(async ({ data }) => {
    if (!data.session) return
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (isAdmin) navigate('/admin', { replace: true })
    else await supabase.auth.signOut()
  })
}, [navigate])

async function handleLogin(e) {
  e.preventDefault()
  setErr('')
  setLoading(true)

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setLoading(false)
    setErr('登入失敗:電郵或密碼不正確')
    return
  }

  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
  setLoading(false)

  if (adminErr || !isAdmin) {
    await supabase.auth.signOut()
    setErr('此帳號沒有後台權限')
    return
  }

  navigate('/admin', { replace: true })
}

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        {/* ⭐ 登入頁 Logo */}
        {loginLogo && (
          <img src={loginLogo} alt="CaseMod"
            className="h-32 w-auto object-contain mx-auto mb-6" />
        )}

        <h1 className="text-2xl font-bold text-center mb-2">後台登入</h1>
        <p className="text-center text-gray-400 text-sm mb-8">管理員專用</p>

        {err && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">電郵</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} placeholder="admin@yourshop.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">密碼</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputClass} placeholder="••••••••" required />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
          {loading ? '登入緊…' : '登入'}
        </button>
      </form>
    </div>
  )
}

export default AdminLogin