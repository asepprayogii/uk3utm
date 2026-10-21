const LOCALE = 'id-ID'

export function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(LOCALE, options)
}

export function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

// "3 hari lalu", "kemarin", dst. Untuk tanggal lama kembali ke format tanggal biasa.
export function timeAgo(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const day = 86400000
  if (diff < 0) return formatDate(value)
  if (diff < 3600000) return 'baru saja'
  if (diff < day) return `${Math.floor(diff / 3600000)} jam lalu`
  if (diff < 2 * day) return 'kemarin'
  if (diff < 14 * day) return `${Math.floor(diff / day)} hari lalu`
  return formatDate(value)
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Nomor WhatsApp lokal (08xx) harus diubah ke format internasional (628xx) untuk wa.me.
export function toWaNumber(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function excerpt(text = '', max = 140) {
  const clean = String(text).replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

/** Masa kepengurusan mengikuti tahun berjalan, jadi tidak perlu diubah manual setiap tahun. */
export function currentPeriod(date = new Date()) {
  return String(date.getFullYear())
}
