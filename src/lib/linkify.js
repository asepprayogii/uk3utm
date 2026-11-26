// Mendeteksi tautan di teks biasa: https://…, www.…, domain polos (forms.gle/abc, bit.ly/x), dan email.
const TLD = 'com|id|co\\.id|ac\\.id|or\\.id|sch\\.id|go\\.id|org|net|link|ly|gle|me|be|app|io|gl|page|site|xyz|info|edu'
const RE = new RegExp(
  [
    '(?:https?:\\/\\/|www\\.)[^\\s<>"]+', // url lengkap / www
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+', // email
    `(?:[a-z0-9-]+\\.)+(?:${TLD})(?:\\/[^\\s<>"]*)?(?![\\w@-])`, // domain polos
  ].join('|'),
  'gi',
)

// Buang tanda baca yang menempel di ujung tautan (titik kalimat, koma, kurung penutup tak berpasangan, dst.).
function trimTail(s) {
  let out = s
  for (;;) {
    const last = out.slice(-1)
    if (/[.,;:!?'"”’»]/.test(last)) { out = out.slice(0, -1); continue }
    if (last === ')' && (out.match(/\)/g) || []).length > (out.match(/\(/g) || []).length) { out = out.slice(0, -1); continue }
    break
  }
  return out
}

/** Pecah teks menjadi potongan { text } dan { text, href }. */
export function linkify(input) {
  const text = String(input ?? '')
  const parts = []
  let cursor = 0
  RE.lastIndex = 0
  let m
  while ((m = RE.exec(text))) {
    const start = m.index
    // Domain polos tidak boleh menempel di tengah kata/alamat lain (mis. bagian dari email atau "a.b.com" yang sudah diproses).
    if (/^[a-z0-9-]/i.test(m[0]) && !/^(?:https?:|www\.)/i.test(m[0]) && !m[0].includes('@') && /[\w@.-]/.test(text[start - 1] ?? ' ')) continue
    const raw = trimTail(m[0])
    if (!raw) continue
    let href
    if (raw.includes('@') && !/^(?:https?:|www\.)/i.test(raw)) href = `mailto:${raw}`
    else if (/^https?:\/\//i.test(raw)) href = raw
    else href = `https://${raw}`
    if (start > cursor) parts.push({ text: text.slice(cursor, start) })
    parts.push({ text: raw, href })
    cursor = start + raw.length
    RE.lastIndex = cursor
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}

// Tampilan ringkas: tanpa "https://", tanpa garis miring penutup, dipotong bila sangat panjang.
export function shortLabel(raw, max = 48) {
  const s = raw.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}
