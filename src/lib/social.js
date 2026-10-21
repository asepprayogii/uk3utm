import { toWaNumber } from './format'

// Platform sosial yang didukung. Pengurus cukup mengisi username/nomor; alamat lengkap dibuat otomatis.
export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', placeholder: '@uk3utm', hint: 'Cukup username.', host: 'instagram.com' },
  { id: 'youtube', label: 'YouTube', placeholder: '@uk3utm atau link channel', hint: 'Username channel atau link.', host: 'youtube.com' },
  { id: 'tiktok', label: 'TikTok', placeholder: '@uk3utm', hint: 'Cukup username.', host: 'tiktok.com' },
  { id: 'facebook', label: 'Facebook', placeholder: 'nama halaman atau link', hint: 'Nama halaman atau link.', host: 'facebook.com' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '08123456789 atau link grup', hint: 'Nomor, atau tempel link grup/saluran.', host: 'wa.me' },
  { id: 'other', label: 'Lainnya', placeholder: 'https://…', hint: 'Alamat lengkap tautan.', host: '' },
]

const isUrl = (v) => /^https?:\/\//i.test(v)
const handle = (v) => v.trim().replace(/^@/, '').replace(/\s+/g, '')

/** Membuat URL lengkap dari isian pengguna. */
export function buildUrl(platform, input) {
  const v = input.trim()
  if (!v) return ''
  if (isUrl(v)) return v
  if (/^(www\.)?[\w-]+\.[a-z]{2,}(\/|$)/i.test(v)) return `https://${v}`
  switch (platform) {
    case 'instagram': return `https://instagram.com/${handle(v)}`
    case 'youtube': return `https://youtube.com/@${handle(v)}`
    case 'tiktok': return `https://tiktok.com/@${handle(v)}`
    case 'facebook': return `https://facebook.com/${handle(v)}`
    case 'whatsapp': return `https://wa.me/${toWaNumber(v)}`
    default: return `https://${v}`
  }
}

/** Menebak platform dari URL tersimpan (tidak perlu kolom tambahan di database). */
export function detectPlatform(url = '') {
  const u = url.toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('youtu.be') || u.includes('youtube.com')) return 'youtube'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'facebook'
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return 'whatsapp'
  return 'other'
}
