const LOCALE = 'id-ID'

export function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(LOCALE, options)
}

// Nomor WhatsApp lokal (08xx) harus diubah ke format internasional (628xx) untuk wa.me.
export function toWaNumber(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}
