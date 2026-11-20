// Video galeri disimpan sebagai tautan YouTube atau Google Drive (tidak memakan ruang penyimpanan).
// Tidak perlu kolom baru: baris galeri dianggap video bila photo_url-nya tautan video.

const YT_ID = /^[\w-]{11}$/

/** Mengenali tautan YouTube / Google Drive. Mengembalikan null bila bukan. */
export function parseVideo(input = '') {
  const raw = String(input).trim()
  if (!raw) return null
  let u
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) } catch { return null }
  const host = u.hostname.replace(/^(www\.|m\.)/, '')
  const seg = u.pathname.split('/').filter(Boolean)

  let yt = null
  if (host === 'youtu.be') yt = seg[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    if (seg[0] === 'watch') yt = u.searchParams.get('v')
    else if (['shorts', 'embed', 'live', 'v'].includes(seg[0])) yt = seg[1]
  }
  if (yt && YT_ID.test(yt)) {
    return {
      kind: 'youtube',
      id: yt,
      url: `https://www.youtube.com/watch?v=${yt}`,
      embed: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&autoplay=1`,
      thumb: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
    }
  }

  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const i = seg.indexOf('d')
    const id = i >= 0 ? seg[i + 1] : u.searchParams.get('id')
    if (id && /^[\w-]{10,}$/.test(id)) {
      return {
        kind: 'drive',
        id,
        url: `https://drive.google.com/file/d/${id}/view`,
        embed: `https://drive.google.com/file/d/${id}/preview`,
        thumb: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
      }
    }
  }
  return null
}

export const isVideo = (item) => !!parseVideo(item?.photo_url)
