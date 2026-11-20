// Bingkai gambar berukuran tetap supaya semua kartu proporsional; gambar tampil UTUH (tidak terpotong).
// Tanpa gambar (atau saat memuat): kotak polos, tanpa teks.
export default function FramedImage({ src, alt = '', ratio = 'aspect-video', className = '', eager = false }) {
  if (!src) {
    return (
      <div className={`${ratio} border border-paper-300 bg-paper-200 ${className}`} aria-hidden="true" />
    )
  }
  return (
    <div className={`relative ${ratio} overflow-hidden bg-paper-200 ${className}`}>
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
    </div>
  )
}
