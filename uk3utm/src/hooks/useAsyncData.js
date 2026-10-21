import { useCallback, useEffect, useState } from 'react'

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
 */
export function useAsyncData(fetcher, initial = null) {
  const [state, setState] = useState({ data: initial, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    withTimeout(fetcher())
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setState({ data: initial, loading: false, error })
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, initial, attempt])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setAttempt((a) => a + 1)
  }, [])

  return { ...state, retry }
}
