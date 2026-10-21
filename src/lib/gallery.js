import { supabase } from './supabase'

// Galeri memakai tabel album_photos yang sudah ada, supaya foto lama tetap tampil.
// Tabel itu mewajibkan album_id, jadi foto baru dikelompokkan ke satu "album" tersembunyi bernama Galeri.
const DEFAULT_TITLE = 'Galeri'

export async function ensureGalleryAlbum() {
  const { data: found, error } = await supabase.from('albums').select('id').eq('title', DEFAULT_TITLE).limit(1)
  if (error) throw error
  if (found?.length) return found[0].id
  const { data, error: insertError } = await supabase.from('albums').insert({ title: DEFAULT_TITLE, description: '' }).select('id').single()
  if (insertError) throw insertError
  return data.id
}

// Urutan terbaru dulu. Memakai detik sejak 2020 agar muat di kolom integer dan foto lama (indeks kecil) tampil terakhir.
export const orderStamp = () => Math.floor(Date.now() / 1000) - 1577836800

export const fetchPhotos = async (limit) => {
  let q = supabase.from('album_photos').select('*').order('order_index', { ascending: false })
  if (limit) q = q.limit(limit)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
