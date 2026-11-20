import { unwrap } from '../hooks/useAsyncData'

/**
 * Menyimpan baris yang memuat kolom baru (mis. pemilik/pembuat). Bila SQL pembaruan belum dijalankan di Supabase
 * dan kolomnya belum ada, simpan lagi tanpa kolom itu supaya admin tetap bisa bekerja.
 */
export async function writeWithFallback(run, row, optionalKeys) {
  try {
    return await unwrap(run(row))
  } catch (err) {
    const missing = /column|schema cache/i.test(err?.message ?? '') && optionalKeys.some((k) => err.message.includes(k))
    if (!missing) throw err
    const slim = Object.fromEntries(Object.entries(row).filter(([k]) => !optionalKeys.includes(k)))
    return unwrap(run(slim))
  }
}
