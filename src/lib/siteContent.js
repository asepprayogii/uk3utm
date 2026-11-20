import { supabase } from './supabase'
import { unwrap } from '../hooks/useAsyncData'
import { fetchPhotos } from './gallery'
import { isVideo } from './video'

// Teks situs disimpan sebagai pasangan key/value di tabel site_content yang sudah ada.
export const HOME_PHOTOS_KEY = 'home_photo_ids'
export const HOME_PHOTOS_FALLBACK = 5

export const DEFAULT_ABOUT =
  'Wadah mahasiswa Kristen Universitas Trunodjoyo Madura untuk bertumbuh bersama dalam iman, persekutuan, dan pelayanan.'

// Kegiatan rutin disimpan sebagai JSON: [{ title, description }].
export function parseActivities(value) {
  try {
    const v = JSON.parse(value ?? '[]')
    return Array.isArray(v) ? v.filter((a) => a && a.title) : []
  } catch {
    return []
  }
}

export async function fetchContent() {
  const rows = await unwrap(supabase.from('site_content').select('*'))
  return Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))
}

// Tidak diketahui apakah `key` bersifat unik di database, jadi pakai ubah-lalu-tambah, bukan upsert.
export async function saveContent(key, value) {
  const existing = await unwrap(supabase.from('site_content').select('key').eq('key', key).limit(1))
  if (existing?.length) await unwrap(supabase.from('site_content').update({ value }).eq('key', key))
  else await unwrap(supabase.from('site_content').insert({ key, value }))
}

export function parseIds(value) {
  try {
    const v = JSON.parse(value ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

// Foto untuk beranda: yang dipilih pengurus (sesuai urutan pilihan); bila belum ada pilihan, 5 foto terbaru.
export async function fetchHomePhotos(content) {
  const ids = parseIds(content?.[HOME_PHOTOS_KEY])
  if (ids.length > 0) {
    const rows = await unwrap(supabase.from('album_photos').select('*').in('id', ids))
    const byId = new Map((rows ?? []).map((p) => [String(p.id), p]))
    const chosen = ids.map((id) => byId.get(String(id))).filter((p) => p && !isVideo(p)) // video tidak dipakai di sampul
    if (chosen.length > 0) return chosen
  }
  return (await fetchPhotos(HOME_PHOTOS_FALLBACK * 4)).filter((p) => !isVideo(p)).slice(0, HOME_PHOTOS_FALLBACK)
}
