import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { to: '/pengumuman', label: 'Pengumuman' },
  { to: '/renungan', label: 'Renungan' },
  { to: '/kepengurusan', label: 'Kepengurusan' },
  { to: '/album', label: 'Album' },
  { to: '/layanan', label: 'Layanan' },
]

const desktopLink = ({ isActive }) =>
  `py-1 transition-colors ${isActive ? 'text-gold-500' : 'text-cream/60 hover:text-gold-500'}`

const mobileLink = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-sm transition-colors ${
    isActive ? 'bg-gold-500/10 text-gold-500' : 'text-cream/70 hover:bg-gold-500/5 hover:text-gold-500'
  }`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 8)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b backdrop-blur transition-colors ${
        scrolled || open ? 'border-gold-500/15 bg-navy-950/95' : 'border-transparent bg-navy-950/60'
      }`}
    >
      <nav aria-label="Navigasi utama" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" onClick={close} className="flex items-center gap-3">
          <img src="/logo-uk3.png" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
          <span className="text-sm font-semibold tracking-wide">UK3 UTM</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 text-sm md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={desktopLink}>
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/admin/login"
            className="rounded-full border border-gold-500/40 px-4 py-1.5 text-xs text-gold-500 transition-colors hover:bg-gold-500/10"
          >
            Admin
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="rounded-lg p-2 text-cream/70 transition-colors hover:text-gold-500 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-gold-500/10 bg-navy-900 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={close} className={mobileLink}>
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/admin/login"
              onClick={close}
              className="mt-2 block rounded-lg border border-gold-500/30 px-3 py-2.5 text-center text-sm text-gold-500"
            >
              Masuk Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
