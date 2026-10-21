// Pengolah gambar di sisi browser: perkecil, potong persegi (opsional), dan kompres
// sebelum diunggah. Foto ponsel 5-10 MB menjadi ratusan KB, sehingga website lebih cepat
// dan kuota penyimpanan Supabase tidak cepat habis.

const MAX_INPUT_BYTES = 15 * 1024 * 1024

function loadBitmap(file) {
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

function canvasToBlob(canvas, type, quality) {
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
  if (!file?.type?.startsWith('image/')) throw new Error('File harus berupa gambar (JPG, PNG, atau WebP).')
  if (file.size > MAX_INPUT_BYTES) throw new Error('Ukuran gambar maksimal 15 MB.')

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
