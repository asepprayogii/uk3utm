import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { PUBLIC_NAV } from '../lib/nav'

const HOME = { to: '/', label: 'Beranda', desc: 'Kembali ke halaman awal' }
const MENU = [HOME, ...PUBLIC_NAV]
import { Brand } from './Logo'

// Kepala majalah: nama di kiri, menu teks di kanan, satu garis tipis di bawah.
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const barRef = useRef(null)
  const rowRef = useRef(null)

  // Garis aktif meluncur halus ke menu yang dipilih (atau yang sedang disorot kursor), lalu kembali ke menu aktif.
  const place = useCallback((target, hover = false) => {
    const bar = barRef.current
    if (!bar) return
    if (!target) {
      bar.style.opacity = '0'
      return
    }
    bar.style.opacity = '1'
    bar.style.width = `${target.offsetWidth}px`
    bar.style.transform = `translateX(${target.offsetLeft}px)`
    bar.style.backgroundColor = hover ? 'var(--color-ink-900, #1C1C1C)' : '#B5452B'
  }, [])
  const toActive = useCallback(() => place(rowRef.current?.querySelector('[aria-current="page"]'), false), [place])
  useLayoutEffect(() => {
    toActive()
    window.addEventListener('resize', toActive)
    document.fonts?.ready.then(toActive)
    return () => window.removeEventListener('resize', toActive)
  }, [pathname, toActive])

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
  const desktopLink = ({ isActive }) => `py-1.5 text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-brand-600' : 'text-ink-900 hover:text-ink-900'}`

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900 bg-paper-50">
      <nav aria-label="Navigasi utama" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link to="/" onClick={close} aria-label="UK3 UTM, ke beranda">
          <Brand />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          <div ref={rowRef} className="relative flex items-center gap-7" onMouseLeave={toActive}>
            {MENU.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={desktopLink} onMouseEnter={(e) => place(e.currentTarget, true)} onFocus={(e) => place(e.currentTarget, true)} onBlur={toActive}>
                {l.label}
              </NavLink>
            ))}
            <span ref={barRef} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 bg-brand-600 opacity-0 transition-[transform,width,opacity,background-color] duration-[400ms] ease-[cubic-bezier(0.65,0,0.35,1)]" />
          </div>
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
        <div id="mobile-menu" className="animate-page-in fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-paper-50 px-5 pt-2 pb-8 lg:hidden">
          <ul>
            {MENU.map(({ to, label, desc }) => (
              <li key={to} className="border-b border-paper-300">
                <NavLink to={to} end={to === '/'} onClick={close} className={({ isActive }) => `flex items-baseline gap-4 py-5 ${isActive ? 'text-brand-600' : 'text-ink-900'}`}>
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
