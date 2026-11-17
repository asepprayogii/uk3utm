import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { clearStamps, isExpired, setNotice, touch } from '../lib/sessionGuard'
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

    // Akhiri sesi yang melewati batas waktu: cabut token di server (bila bisa), hapus dari browser, lalu minta masuk lagi.
    async function endExpired() {
      setNotice('Sesi Anda berakhir demi keamanan. Silakan masuk lagi.')
      clearStamps()
      const { error: err } = await supabase.auth.signOut()
      if (err) await supabase.auth.signOut({ scope: 'local' })
      load(null)
    }

    async function guard() {
      if (!active) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session && isExpired()) await endExpired()
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && isExpired()) {
        await endExpired()
        return
      }
      load(session?.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') clearStamps()
      // Ditunda agar tidak memanggil Supabase di dalam callback auth (menghindari deadlock).
      setTimeout(() => load(session?.user), 0)
    })

    // Kembali ke tab/aplikasi (misalnya besok paginya): periksa dulu, baru catat sebagai aktivitas.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      guard().then(touch)
    }
    const onActivity = () => touch()
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const timer = setInterval(guard, 30 * 1000)

    return () => {
      active = false
      listener.subscription.unsubscribe()
      events.forEach((e) => window.removeEventListener(e, onActivity))
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      clearInterval(timer)
    }
  }, [])

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
