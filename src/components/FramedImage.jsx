// Bingkai gambar berukuran tetap supaya semua kartu proporsional; gambar tampil UTUH (tidak terpotong).
// Sisa ruang di sisi gambar (mis. poster tegak di bingkai lebar) diisi versi buram dari gambar yang sama, bukan kotak kosong.
// Tanpa gambar (atau saat memuat): kotak polos, tanpa teks.
export default function FramedImage({ src, alt = '', ratio = 'aspect-video', className = '', eager = false }) {
  if (!src) {
    return (
      <div className={`${ratio} border border-paper-300 bg-paper-200 ${className}`} aria-hidden="true" />
    )
  }
  return (
    <div className={`relative isolate ${ratio} overflow-hidden bg-paper-200 ${className}`}>
      {/* Latar: gambar yang sama diperbesar dan dikaburkan; menutup semua ruang kosong. */}
      <img src={src} alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 -z-10 h-full w-full scale-150 object-cover blur-2xl saturate-150" />
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
    </div>
  )
}
