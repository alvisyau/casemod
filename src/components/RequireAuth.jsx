import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function RequireAuth({ children }) {
  const [session, setSession] = useState(undefined) // undefined=查緊, null=冇, object=有

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <p className="text-center text-gray-400 py-24">驗證緊…</p>
  }
  if (session === null) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default RequireAuth