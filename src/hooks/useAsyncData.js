import { useCallback, useEffect, useRef, useState } from 'react'

// Melempar error Supabase supaya bisa ditangani lewat try/catch atau .catch().
export async function unwrap(query) {
  const { data, error } = await query
  if (error) throw error
  return data
}

const TIMEOUT_MS = 15000

// Supaya koneksi yang menggantung berujung ke pesan error, bukan loading tanpa akhir.
function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Permintaan terlalu lama (timeout).')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Mengambil data async dengan state loading/error + tombol coba lagi.
 * `fetcher` dan `initial` harus stabil (didefinisikan di luar komponen
 * atau dibungkus useCallback).
 *
 * `live: true` memperbarui data diam-diam di latar belakang (tiap `every` ms saat tab terlihat, dan saat tab
 * dibuka kembali) sehingga halaman ikut berubah tanpa perlu di-refresh. Tampilan hanya diperbarui bila datanya berubah.
 */
export function useAsyncData(fetcher, initial = null, { live = false, every = 30000 } = {}) {
  const [state, setState] = useState({ data: initial, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)
  const lastJson = useRef(null)

  useEffect(() => {
    let cancelled = false

    withTimeout(fetcher())
      .then((data) => {
        if (cancelled) return
        if (live) lastJson.current = JSON.stringify(data)
        setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setState({ data: initial, loading: false, error })
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, initial, attempt, live])

  useEffect(() => {
    if (!live) return undefined
    let cancelled = false
    let busy = false
    let last = Date.now()
    const refresh = () => {
      if (busy || document.hidden) return
      busy = true
      withTimeout(fetcher())
        .then((data) => {
          if (cancelled) return
          const json = JSON.stringify(data)
          const changed = json !== lastJson.current
          lastJson.current = json
          setState((s) => (changed || s.error ? { data, loading: false, error: null } : s))
        })
        .catch(() => {}) // gagal diam-diam: tampilan lama tetap dipakai
        .finally(() => {
          busy = false
          last = Date.now()
        })
    }
    const onShow = () => {
      if (!document.hidden && Date.now() - last > 5000) refresh()
    }
    const timer = setInterval(refresh, every)
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('focus', onShow)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('focus', onShow)
    }
  }, [fetcher, live, every])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setAttempt((a) => a + 1)
  }, [])

  return { ...state, retry }
}
