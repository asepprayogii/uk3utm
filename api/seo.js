// Pratinjau link per halaman. Hanya dipanggil untuk crawler (WhatsApp, Facebook, Telegram, Google, dll.)
// lewat aturan "has: user-agent" di vercel.json, jadi pengunjung biasa tidak pernah melewati fungsi ini.
import { PAGES, UUID, buildMeta, clip, fallbackHtml, injectMeta } from './_lib/seo-core.js'

const SB_URL = () => (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SB_KEY = () => process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

async function row(table, id, cols) {
  const url = SB_URL()
  if (!url || !UUID.test(id)) return null
  const r = await fetch(`${url}/rest/v1/${table}?select=${cols}&id=eq.${id}&limit=1`, {
    headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` },
  })
  if (!r.ok) return null
  const [first] = await r.json()
  return first ?? null
}

const ogImage = (origin, src) => (src ? `${origin}/api/og-image?u=${encodeURIComponent(src)}` : null)

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `https://${host}`
  const { type, id, page } = req.query
  let m

  try {
    if (type === 'pengumuman') {
      const a = await row('announcements', id, 'title,content,image_url,created_at')
      if (a) m = buildMeta({ origin, path: `/pengumuman/${id}`, title: a.title, description: clip(a.content, 200), image: ogImage(origin, a.image_url), type: 'article', published: a.created_at })
    } else if (type === 'renungan') {
      const d = await row('devotionals', id, 'title,content,verse,image_url,created_at')
      if (d) m = buildMeta({ origin, path: `/renungan/${id}`, title: d.title, description: clip(d.verse ? `“${d.verse}” — ${d.content}` : d.content, 200), image: ogImage(origin, d.image_url), type: 'article', published: d.created_at })
    } else if (PAGES[page]) {
      m = buildMeta({ origin, path: `/${page}`, title: PAGES[page][0], description: PAGES[page][1] })
    }
  } catch {
    /* data gagal diambil: pakai pratinjau umum di bawah */
  }
  m ??= buildMeta({ origin, path: '/' })

  let html
  try {
    const r = await fetch(`${origin}/index.html`)
    html = r.ok ? injectMeta(await r.text(), m) : fallbackHtml(m)
  } catch {
    html = fallbackHtml(m)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=3600')
  res.status(200).send(html)
}
