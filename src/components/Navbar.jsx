import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { PUBLIC_NAV } from '../lib/nav'
import { Brand } from './Logo'

// Kepala majalah: nama di kiri, menu teks di kanan, satu garis tipis di bawah.
export default function Navbar() {
  const [open, setOpen] = useState(false)

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

  const close = () => setOpen(false)
  const desktopLink = ({ isActive }) =>
    `border-b-2 py-1 text-sm font-semibold transition-colors ${
      isActive ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-900 hover:border-ink-900'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900 bg-paper-50">
      <nav aria-label="Navigasi utama" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link to="/" onClick={close} aria-label="UK3 UTM, ke beranda">
          <Brand />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {PUBLIC_NAV.map((l) => (
            <NavLink key={l.to} to={l.to} className={desktopLink}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/admin/login" className="border border-ink-900 px-4 py-1.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-paper-50">
            Admin
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="p-2 text-ink-900 lg:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-paper-50 px-5 pt-2 pb-8 lg:hidden">
          <ul>
            {PUBLIC_NAV.map(({ to, label, desc }, i) => (
              <li key={to} className="border-b border-paper-300">
                <NavLink to={to} onClick={close} className={({ isActive }) => `flex items-baseline gap-4 py-5 ${isActive ? 'text-brand-600' : 'text-ink-900'}`}>
                  <span className="w-6 text-xs font-bold text-ink-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="display block text-3xl">{label}</span>
                    <span className="mt-1 block text-xs text-ink-500">{desc}</span>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/admin/login" onClick={close} className="mt-6 block border border-ink-900 py-3 text-center text-sm font-semibold text-ink-900">
            Masuk sebagai pengurus
          </Link>
        </div>
      )}
    </header>
  )
}
