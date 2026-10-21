import { initials } from '../../lib/format'

const SIZES = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-3xl',
  '2xl': 'h-36 w-36 text-4xl',
}

const PALETTE = [
  'from-brand-600 to-brand-800',
  'from-brand-500 to-brand-700',
  'from-brand-700 to-brand-900',
  'from-gold-500 to-gold-700',
]

function colorFor(name = '') {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

// Foto bila ada; bila tidak, inisial berwarna konsisten per nama.
export default function Avatar({ name, src, size = 'md', ring = false, className = '' }) {
  const ringCls = ring ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-white' : ''
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        loading="lazy"
        className={`${SIZES[size]} ${ringCls} shrink-0 rounded-full bg-paper-200 object-cover ${className}`}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className={`${SIZES[size]} ${ringCls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${colorFor(name)} ${className}`}
    >
      {initials(name)}
    </div>
  )
}
