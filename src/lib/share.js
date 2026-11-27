/** Alamat lengkap sebuah halaman untuk dibagikan. */
export const fullUrl = (path) => `${window.location.origin}${path}`

/** Salin ke papan klip, dengan cadangan untuk browser lama / koneksi tanpa HTTPS. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { /* abaikan */ }
    ta.remove()
    return ok
  }
}
