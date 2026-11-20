// Pengolah gambar di sisi browser: perkecil, potong persegi (opsional), dan kompres
// sebelum diunggah. Foto ponsel 5-10 MB menjadi ratusan KB, sehingga website lebih cepat
// dan kuota penyimpanan Supabase tidak cepat habis.

const MAX_INPUT_BYTES = 15 * 1024 * 1024

// Atribut `accept` untuk semua input gambar: apa saja yang berupa gambar, termasuk HEIC dari iPhone.
export const IMAGE_ACCEPT = 'image/*,.heic,.heif,.avif,.webp,.bmp,.gif,.jfif'

const EXT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif' }
const extOf = (name = '') => name.split('.').pop().toLowerCase()
const isHeicFile = (f) => /hei[cf]/i.test(f.type) || ['heic', 'heif'].includes(extOf(f.name))

/**
 * Mengubah file apa pun menjadi gambar yang bisa dibaca browser.
 * HEIC/HEIF (foto iPhone) dikonversi ke JPEG di browser; file tanpa jenis (sering di Windows) dikenali dari ekstensinya.
 */
export async function toReadableImage(file) {
  if (!file) throw new Error('Pilih file gambar.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('Ukuran gambar maksimal 15 MB.')
  if (isHeicFile(file)) {
    try {
      // Dimuat hanya saat ada foto HEIC, dari berkas lokal di /public (tidak perlu paket npm tambahan).
      const url = new URL('/vendor/heic-to.js', window.location.origin).href // alamat disusun saat dijalankan agar tidak diproses bundler
      const { heicTo } = await import(/* @vite-ignore */ url)
      const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
    } catch {
      throw new Error('Foto HEIC ini tidak bisa dibuka. Coba ekspor ke JPG dulu.')
    }
  }
  if (file.type?.startsWith('image/')) return file
  const type = EXT_TYPES[extOf(file.name)]
  if (type) return new File([file], file.name, { type })
  throw new Error('File harus berupa gambar (JPG, PNG, HEIC, WebP, dan sejenisnya).')
}

export function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => loadViaImage(file))
  }
  return loadViaImage(file)
}

function loadViaImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak bisa dibaca. Coba file lain.'))
    }
    img.src = url
  })
}

export function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses gambar.'))), type, quality)
  })
}

/**
 * @param {File} file
 * @param {{ maxSize?: number, square?: boolean, quality?: number, lossless?: boolean }} opts
 *   lossless: simpan PNG tajam (untuk QRIS/barcode agar tetap terbaca scanner).
 * @returns {Promise<{ blob: Blob, preview: string, ext: string, type: string }>}
 */
export async function prepareImage(file, { maxSize = 1600, square = false, quality = 0.85, lossless = false } = {}) {
  file = await toReadableImage(file)
  const bitmap = await loadBitmap(file)
  const srcW = bitmap.width
  const srcH = bitmap.height

  let sx = 0
  let sy = 0
  let sw = srcW
  let sh = srcH
  if (square) {
    const side = Math.min(srcW, srcH)
    sx = Math.floor((srcW - side) / 2)
    sy = Math.floor((srcH - side) / 3) // potong sedikit lebih ke atas agar wajah tidak terpotong
    sw = side
    sh = side
  }

  const scale = Math.min(1, maxSize / Math.max(sw, sh))
  const outW = Math.max(1, Math.round(sw * scale))
  const outH = Math.max(1, Math.round(sh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!lossless) {
    ctx.fillStyle = '#ffffff' // JPEG tidak punya transparansi
    ctx.fillRect(0, 0, outW, outH)
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH)
  if (typeof bitmap.close === 'function') bitmap.close()

  const type = lossless ? 'image/png' : 'image/jpeg'
  const blob = await canvasToBlob(canvas, type, quality)
  return { blob, preview: URL.createObjectURL(blob), ext: lossless ? 'png' : 'jpg', type }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ---- Potong foto profil (rasio 4:5) ----
export const PORTRAIT_RATIO = 1.25 // tinggi / lebar

/** Area potong otomatis: selebar mungkin, agak ke atas supaya wajah tidak terpotong. */
export function autoCrop(srcW, srcH) {
  const w = Math.min(srcW, srcH / PORTRAIT_RATIO)
  const h = w * PORTRAIT_RATIO
  return { x: (srcW - w) / 2, y: Math.max(0, (srcH - h) / 3), w }
}

/** Menjaga area potong tetap di dalam gambar. `w` dibatasi ke ukuran terbesar yang muat. */
export function clampCrop(crop, srcW, srcH) {
  const maxW = Math.min(srcW, srcH / PORTRAIT_RATIO)
  const w = Math.min(Math.max(crop.w, maxW / 6), maxW)
  const h = w * PORTRAIT_RATIO
  return { w, x: Math.min(Math.max(crop.x, 0), srcW - w), y: Math.min(Math.max(crop.y, 0), srcH - h) }
}

/** Menggambar area potong ke JPEG 4:5 (maks. 800x1000). */
export async function renderPortrait(file, crop, { outW = 800, quality = 0.85 } = {}) {
  file = await toReadableImage(file)
  const bitmap = await loadBitmap(file)
  const c = clampCrop(crop ?? autoCrop(bitmap.width, bitmap.height), bitmap.width, bitmap.height)
  const w = Math.min(outW, Math.round(c.w))
  const h = Math.round(w * PORTRAIT_RATIO)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, c.x, c.y, c.w, c.w * PORTRAIT_RATIO, 0, 0, w, h)
  if (typeof bitmap.close === 'function') bitmap.close()
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  return { blob, preview: URL.createObjectURL(blob), ext: 'jpg', type: 'image/jpeg' }
}
