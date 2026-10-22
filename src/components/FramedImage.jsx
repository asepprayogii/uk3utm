import { LogoMark } from './Logo'

// Bingkai gambar berukuran tetap supaya semua kartu proporsional, tetapi gambar tampil UTUH (tidak terpotong):
// gambar asli ditaruh di depan, dan salinannya yang diburamkan mengisi sisa ruang.
export default function FramedImage({ src, alt = '', ratio = 'aspect-video', className = '', eager = false }) {
  if (!src) {
    return (
      <div className={`hero-bg flex ${ratio} items-center justify-center ${className}`} aria-hidden="true">
        <LogoMark size={72} alt="" className="opacity-80" />
      </div>
    )
  }
  return (
    <div className={`relative ${ratio} overflow-hidden bg-brand-900 ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-xl" />
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-contain" />
    </div>
  )
}
