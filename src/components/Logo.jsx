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

// Nama majalah: logo kecil + nama serif.
export function Brand({ size = 36, light = false, showTagline = true, className = '' }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} alt="" />
      <span className="flex flex-col leading-none">
        <span className={`display text-2xl ${light ? 'text-paper-50' : 'text-ink-900'}`}>UK3 UTM</span>
        {showTagline && (
          <span className={`mt-1 hidden text-[10px] font-semibold tracking-[0.14em] uppercase sm:block ${light ? 'text-paper-50/60' : 'text-ink-500'}`}>
            Kerohanian Kristen · Trunodjoyo Madura
          </span>
        )}
      </span>
    </span>
  )
}
