import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Tutup menu saat navigasi
  useEffect(() => { setOpen(false) }, [location.pathname])

  const links = [
    { to: '/', label: 'Beranda' },
    { to: '/pengumuman', label: 'Pengumuman' },
    { to: '/renungan', label: 'Renungan' },
    { to: '/kepengurusan', label: 'Kepengurusan' },
    { to: '/album', label: 'Album' },
    { to: '/layanan', label: 'Layanan' },
  ]

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled || open
          ? 'bg-[#080d17] border-b border-[#C9A84C]/15 shadow-lg shadow-black/20'
          : 'bg-[#080d17]/80 backdrop-blur border-b border-[#C9A84C]/10'
      }`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center border border-[#C9A84C]/40">
              <span className="text-[#C9A84C] text-xs font-bold" style={{fontFamily:'Cinzel,serif'}}>UK3</span>
            </div>
            <div>
              <div className="text-[#F5F0E8] font-semibold text-sm leading-tight">UK3 UTM</div>
              <div className="text-[#F5F0E8]/30 text-[9px] leading-tight tracking-widest uppercase hidden sm:block">
                Kerohanian Kristen
              </div>
            </div>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  isActive(l.to)
                    ? 'text-[#C9A84C] bg-[#C9A84C]/10'
                    : 'text-[#F5F0E8]/60 hover:text-[#F5F0E8] hover:bg-[#F5F0E8]/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className="ml-3 px-4 py-1.5 border border-[#C9A84C]/40 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all"
            >
              Admin
            </Link>
          </div>

          {/* HAMBURGER */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-xl hover:bg-[#F5F0E8]/5 transition-all"
            aria-label="Menu"
          >
            <span className={`block h-0.5 bg-[#F5F0E8] transition-all duration-300 origin-center ${
              open ? 'w-5 rotate-45 translate-y-2' : 'w-5'
            }`} />
            <span className={`block h-0.5 bg-[#F5F0E8] transition-all duration-300 ${
              open ? 'w-0 opacity-0' : 'w-4'
            }`} />
            <span className={`block h-0.5 bg-[#F5F0E8] transition-all duration-300 origin-center ${
              open ? 'w-5 -rotate-45 -translate-y-2' : 'w-5'
            }`} />
          </button>
        </div>

        {/* MOBILE MENU */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-5 pb-5 flex flex-col gap-1 border-t border-[#C9A84C]/10 pt-4">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 ${
                  isActive(l.to)
                    ? 'text-[#C9A84C] bg-[#C9A84C]/10 font-medium'
                    : 'text-[#F5F0E8]/70 hover:bg-[#F5F0E8]/5 hover:text-[#F5F0E8]'
                }`}
              >
                {isActive(l.to) && <span className="w-1 h-1 rounded-full bg-[#C9A84C]" />}
                {l.label}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className="mt-2 px-4 py-3 border border-[#C9A84C]/30 text-[#C9A84C] rounded-xl text-sm text-center hover:bg-[#C9A84C]/10 transition-all"
            >
              Masuk sebagai Admin
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}