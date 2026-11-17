const SIZES = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-3xl',
  '2xl': 'h-36 w-36 text-4xl',
  fill: 'aspect-[4/5] w-full text-5xl',
  // Foto pengurus 4:5, sama dengan di website.
  'p-sm': 'aspect-[4/5] w-12 text-sm',
  'p-md': 'aspect-[4/5] w-16 text-base',
}

// Foto profil bawaan: siluet orang (kepala + bahu) bila belum ada foto.
function Silhouette() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="100" height="100" fill="#e0d7c5" />
      <circle cx="50" cy="38" r="17" fill="#b3ac9c" />
      <path d="M14 100c0-22 15-36 36-36s36 14 36 36z" fill="#b3ac9c" />
    </svg>
  )
}

// Foto bila ada; bila tidak, inisial berwarna konsisten per nama.
export default function Avatar({ name, src, size = 'md', ring = false, className = '' }) {
  const ringCls = ring ? 'ring-1 ring-brand-600 ring-offset-4 ring-offset-paper-50' : ''
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        loading="lazy"
        className={`${SIZES[size]} ${ringCls} shrink-0 rounded-sm bg-paper-200 object-cover ${className}`}
      />
    )
  }
  return (
    <div role="img" aria-label={name ?? 'Foto profil'} className={`${SIZES[size]} ${ringCls} shrink-0 overflow-hidden rounded-sm ${className}`}>
      <Silhouette />
    </div>
  )
}
