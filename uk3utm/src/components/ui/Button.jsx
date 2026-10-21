import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS = {
  primary: 'bg-brand-700 text-white shadow-soft hover:bg-brand-800',
  gold: 'bg-gold-400 text-brand-950 shadow-soft hover:bg-gold-300',
  secondary: 'border border-brand-200 bg-white text-brand-800 hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dangerSoft: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  light: 'border border-white/30 text-white hover:bg-white/10',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm sm:text-base',
}

export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) {
  const cls = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`
  const content = (
    <>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : Icon && <Icon size={16} aria-hidden="true" />}
      {children}
      {IconRight && !loading && <IconRight size={16} aria-hidden="true" />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}
