import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking') // checking | ok | denied

  useEffect(() => {
    let alive = true
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { if (alive) setStatus('denied'); return }

      // ⭐ 唔單止有 session,仲要係 admin
      const { data: isAdmin, error } = await supabase.rpc('is_admin')
      if (!alive) return

      if (error || !isAdmin) {
        await supabase.auth.signOut()   // 有 session 但唔係 admin → 踢出
        setStatus('denied')
      } else {
        setStatus('ok')
      }
    }
    check()
    return () => { alive = false }
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        驗證中…
      </div>
    )
  }
  if (status === 'denied') return <Navigate to="/admin/login" replace />
  return children
}

export default RequireAuth