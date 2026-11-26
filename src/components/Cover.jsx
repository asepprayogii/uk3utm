import FramedImage from './FramedImage'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']

// Sampul untuk pengumuman/renungan. Ada gambar: tampil utuh dengan latar buram dari gambar itu sendiri.
// Tanpa gambar: bukan kotak kosong, melainkan ubin tipografis berisi tanggal, jadi tiap item tetap punya sampul yang seimbang.
export default function Cover({ src, alt = '', date, ratio = 'aspect-[4/3]', className = '', eager = false }) {
  if (src) return <FramedImage src={src} alt={alt} ratio={ratio} className={className} eager={eager} />
  const d = date ? new Date(date) : null
  const ok = d && !Number.isNaN(d.getTime())
  return (
    <div className={`relative flex ${ratio} flex-col items-center justify-center overflow-hidden border border-paper-300 bg-paper-200 ${className}`} aria-hidden="true">
      <span className="pattern-cross absolute inset-0 opacity-[0.07]" />
      {ok ? (
        <>
          <span className="display relative text-[clamp(3.5rem,9vw,6rem)] leading-none text-brand-600">{d.getDate()}</span>
          <span className="kicker relative mt-3 text-ink-700">{MONTHS[d.getMonth()]} {d.getFullYear()}</span>
        </>
      ) : null}
    </div>
  )
}
