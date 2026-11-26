// Bingkai gambar berukuran tetap supaya semua kartu proporsional; gambar tampil UTUH (tidak terpotong).
// Sisa ruang di sisi gambar (mis. poster tegak di bingkai lebar) diisi bagian TENGAH gambar yang sama dengan kabur tipis
// (warna dan suasananya masih terasa), bukan kotak kosong.
// Tanpa gambar (atau saat memuat): kotak polos, tanpa teks.
export default function FramedImage({ src, alt = '', ratio = 'aspect-video', className = '', eager = false }) {
  if (!src) {
    return (
      <div className={`${ratio} border border-paper-300 bg-paper-200 ${className}`} aria-hidden="true" />
    )
  }
  return (
    <div className={`relative isolate ${ratio} overflow-hidden bg-paper-200 ${className}`}>
      {/* Latar: gambar yang sama, diisi penuh dari tengah (object-cover), kabur tipis (±25% dari sebelumnya). */}
      <img src={src} alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover object-center blur-[10px]" />
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
    </div>
  )
}
