import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'

// Satu sumber data auth untuk seluruh aplikasi, sehingga profil tidak
// di-fetch ulang setiap kali pengurus berpindah halaman admin.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load(sessionUser) {
      if (!active) return
      setUser(sessionUser ?? null)

      if (!sessionUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle()

      if (!active) return
      setProfile(data ?? { role: 'viewer' })
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session?.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Ditunda agar tidak memanggil Supabase di dalam callback auth (menghindari deadlock).
      setTimeout(() => load(session?.user), 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
