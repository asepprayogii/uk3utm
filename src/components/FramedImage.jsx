// Bingkai gambar berukuran tetap supaya semua kartu proporsional; gambar tampil UTUH (tidak terpotong).
// Tanpa gambar: placeholder bergaris dengan caption deskriptif, siap diganti foto asli.
export default function FramedImage({ src, alt = '', ratio = 'aspect-video', className = '', eager = false, placeholder = 'Foto kegiatan UK3 UTM' }) {
  if (!src) {
    return (
      <div className={`flex ${ratio} items-end border border-paper-300 bg-paper-200 p-3 ${className}`} aria-hidden="true">
        <span className="text-[11px] leading-snug font-semibold tracking-wider text-ink-500 uppercase">Foto — {placeholder}</span>
      </div>
    )
  }
  return (
    <div className={`relative ${ratio} overflow-hidden bg-paper-200 ${className}`}>
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-contain" />
    </div>
  )
}
