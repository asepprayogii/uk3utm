// Pengatur meta untuk mesin pencari. Situs ini SPA, jadi tiap halaman memperbarui meta saat dibuka.
const SITE = 'https://uk3utm.vercel.app'

function upsert(selector, create) {
  let el = document.head.querySelector(selector)
  if (!el) { el = create(); document.head.appendChild(el) }
  return el
}

export function setDescription(text) {
  if (!text) return
  upsert('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).setAttribute('content', text)
}

export function setCanonical(pathname) {
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).setAttribute('href', SITE + path)
}

export function setNoIndex(on) {
  const sel = 'meta[name="robots"]'
  const el = document.head.querySelector(sel)
  if (on) upsert(sel, () => Object.assign(document.createElement('meta'), { name: 'robots' })).setAttribute('content', 'noindex')
  else el?.remove()
}
