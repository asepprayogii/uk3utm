// Logo resmi UK3 (perisai ungu-putih: merpati, salib, Alfa-Omega).
export function LogoMark({ size = 40, className = '', alt = 'Logo UK3 UTM' }) {
  return (
    <img
      src="/logo-uk3.png"
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function Brand({ size = 40, light = false, showTagline = true, className = '' }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} alt="" />
      <span className="flex flex-col leading-tight">
        <span className={`text-base font-extrabold tracking-wide ${light ? 'text-white' : 'text-brand-900'}`}>UK3 UTM</span>
        {showTagline && (
          <span className={`hidden text-[11px] sm:block ${light ? 'text-white/60' : 'text-ink-500'}`}>
            Kerohanian Kristen · Trunojoyo Madura
          </span>
        )}
      </span>
    </span>
  )
}
