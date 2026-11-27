// Logika murni untuk pratinjau link (Open Graph). Dipakai api/seo.js dan diuji terpisah.
const SITE_NAME = 'UK3 UTM'
const DEFAULT_DESC = 'Situs resmi UK3 UTM (Persekutuan Doa Revive): pengumuman, renungan, kepengurusan, galeri, dan layanan Unit Kegiatan Kerohanian Kristen Universitas Trunodjoyo Madura.'

export const PAGES = {
  tentang: ['Tentang UK3 UTM', 'Sejarah, visi dan misi, makna lambang, dan kegiatan Unit Kegiatan Kerohanian Kristen Universitas Trunodjoyo Madura.'],
  pengumuman: ['Pengumuman', 'Jadwal, kegiatan, dan kabar terbaru dari UK3 UTM.'],
  renungan: ['Renungan', 'Bacaan singkat untuk menguatkan iman dari UK3 UTM.'],
  kepengurusan: ['Kepengurusan', 'Struktur dan wajah para pengurus UK3 UTM.'],
  galeri: ['Galeri', 'Foto dan video momen kebersamaan UK3 UTM.'],
  layanan: ['Layanan UK3', 'Konseling, doa, dan layanan lain dari UK3 UTM. Hubungi kami untuk kebutuhan rohani dan organisasi.'],
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function clip(text, max = 200) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).trim()}…`
}

/** Susun data pratinjau satu halaman. `origin` mis. https://uk3utm.vercel.app */
export function buildMeta({ origin, path, title, description, image, type = 'website', published }) {
  const url = origin + path
  const full = title && title !== SITE_NAME ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Unit Kegiatan Kerohanian Kristen`
  return {
    title: full,
    description: description || DEFAULT_DESC,
    url,
    image: image || `${origin}/thumbnail.png`,
    hasCustomImage: !!image,
    type,
    published,
  }
}

export function metaTags(m) {
  const t = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(m.url)}" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="id_ID" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:image" content="${esc(m.image)}" />`,
  ]
  if (m.hasCustomImage) t.push('<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />', `<meta property="og:image:alt" content="${esc(m.title)}" />`)
  if (m.published) t.push(`<meta property="article:published_time" content="${esc(m.published)}" />`)
  t.push(
    `<meta name="twitter:card" content="${m.hasCustomImage ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.image)}" />`,
  )
  return t.join('\n    ')
}

/** Ganti tag judul/deskripsi/OG di index.html dengan milik halaman ini (sisanya, termasuk skrip aplikasi, tidak disentuh). */
export function injectMeta(html, m) {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:property|name)="(?:og:[^"]*|twitter:[^"]*|description)"[\s\S]*?\/?>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
  const block = `    ${metaTags(m)}\n`
  return /<\/head>/i.test(cleaned) ? cleaned.replace(/<\/head>/i, `${block}  </head>`) : block + cleaned
}

/** Cadangan bila index.html tidak bisa diambil: halaman minimal yang tetap memuat tag pratinjau lalu membuka alamat asli. */
export function fallbackHtml(m) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8" />\n    ${metaTags(m)}\n</head><body><a href="${esc(m.url)}">${esc(m.title)}</a><script>location.replace(${JSON.stringify(m.url)})</script></body></html>`
}
