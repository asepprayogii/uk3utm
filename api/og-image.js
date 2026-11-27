// Gambar pratinjau 1200x630 dari gambar pengumuman/renungan: gambar utuh di tengah, latar dari gambar yang sama (kabur tipis).
// Ukurannya dikecilkan (±100 KB) karena WhatsApp sering menolak gambar pratinjau yang terlalu besar.
import sharp from 'sharp'

const W = 1200
const H = 630
const MAX_BYTES = 15 * 1024 * 1024

function allowed(u) {
  try {
    const x = new URL(u)
    const own = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const okHost = own ? x.host === new URL(own).host : x.host.endsWith('.supabase.co')
    return x.protocol === 'https:' && okHost && x.pathname.includes('/storage/v1/object/public/')
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  const src = req.query.u
  if (!src || !allowed(src)) return res.status(400).send('Bad request')
  try {
    const r = await fetch(src)
    if (!r.ok) return res.status(404).send('Not found')
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > MAX_BYTES) return res.status(413).send('Too large')

    const base = sharp(buf, { failOn: 'none' }).rotate()
    const bg = await base.clone().resize(W, H, { fit: 'cover', position: 'centre' }).blur(12).toBuffer()
    const fg = await base.clone().resize({ width: W, height: H, fit: 'inside' }).toBuffer()
    const out = await sharp(bg).composite([{ input: fg, gravity: 'centre' }]).jpeg({ quality: 80, mozjpeg: true }).toBuffer()

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable')
    res.status(200).send(out)
  } catch {
    res.status(422).send('Cannot process image')
  }
}
