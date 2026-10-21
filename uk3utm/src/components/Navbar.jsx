import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronRight, Menu, X } from 'lucide-react'
import { PUBLIC_NAV } from '../lib/nav'
import { Brand } from './Logo'

// Selalu berada di atas area ungu (hero / banner halaman): transparan dengan teks putih,
// lalu berubah putih bersih saat halaman digulir.
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 16)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const solid = scrolled || open
  const close = () => setOpen(false)

  const desktopLink = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? solid ? 'bg-brand-50 text-brand-700' : 'bg-white/15 text-white'
        : solid ? 'text-ink-700 hover:bg-paper-100 hover:text-brand-700' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? 'bg-white/95 shadow-soft backdrop-blur' : 'bg-transparent'
      }`}
    >
      <nav aria-label="Navigasi utama" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link to="/" onClick={close} aria-label="UK3 UTM, ke beranda">
          <Brand light={!solid} />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((l) => (
            <NavLink key={l.to} to={l.to} className={desktopLink}>
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/admin/login"
            className={`ml-3 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              solid ? 'border-brand-200 text-brand-700 hover:bg-brand-50' : 'border-white/30 text-white hover:bg-white/10'
            }`}
          >
            Admin
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className={`rounded-lg p-2 transition-colors lg:hidden ${solid ? 'text-ink-900 hover:bg-paper-100' : 'text-white hover:bg-white/10'}`}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-paper-200 bg-white px-4 pt-3 pb-6 lg:hidden">
          <ul className="flex flex-col">
            {PUBLIC_NAV.map(({ to, label, desc, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={close}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-xl px-3 py-3 transition-colors ${isActive ? 'bg-brand-50' : 'hover:bg-paper-100'}`
                  }
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink-900">{label}</span>
                    <span className="block truncate text-xs text-ink-500">{desc}</span>
                  </span>
                  <ChevronRight size={16} className="text-ink-300" aria-hidden="true" />
                </NavLink>
              </li>
            ))}
          </ul>
          <Link
            to="/admin/login"
            onClick={close}
            className="mt-4 block rounded-xl border border-brand-200 py-3 text-center text-sm font-semibold text-brand-700"
          >
            Masuk sebagai pengurus
          </Link>
        </div>
      )}
    </header>
  )
}
