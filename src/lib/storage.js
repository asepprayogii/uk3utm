import { supabase } from './supabase'

const BUCKET = 'uk3-media'

function uniqueName(ext) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${Date.now()}-${rand}.${ext}`
}

/** Unggah hasil prepareImage() ke bucket dan kembalikan URL publiknya. */
export async function uploadPrepared(prepared, folder) {
  const path = `${folder}/${uniqueName(prepared.ext)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, prepared.blob, {
    contentType: prepared.type,
    cacheControl: '31536000',
  })
  if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Hapus file lama dari bucket (upaya terbaik; kegagalan tidak menghentikan proses). */
export async function removeByUrl(url) {
  if (!url) return
  try {
    const marker = `/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
    await supabase.storage.from(BUCKET).remove([path])
  } catch {
    /* abaikan */
  }
}
