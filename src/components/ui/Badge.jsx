const TONES = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  gold: 'bg-brand-600 text-paper-50 border-brand-600',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-paper-100 text-ink-500 border-paper-300',
}

export default function Badge({ tone = 'brand', icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${TONES[tone]} ${className}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}
