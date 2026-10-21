import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { LogoMark } from './Logo'

// Kerangka halaman dalam: navbar, banner ungu berlogo (judul + penunjuk lokasi), konten, footer.
export default function PageLayout({ title, eyebrow, description, crumbs = [], width = 'max-w-5xl', children }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-50 text-ink-900">
      <Navbar />

      <header className="hero-bg pattern-cross relative overflow-hidden pt-28 pb-14 text-white sm:pb-16">
        <LogoMark
          size={320}
          alt=""
          className="pointer-events-none absolute -right-16 -bottom-24 hidden opacity-[0.07] md:block"
        />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6">
          <nav aria-label="Lokasi halaman" className="mb-5 flex items-center gap-1.5 text-xs text-white/55">
            <Link to="/" className="transition-colors hover:text-white">
              Beranda
            </Link>
            <ChevronRight size={12} aria-hidden="true" />
            {crumbs.map((c) => (
              <span key={c.to} className="flex items-center gap-1.5">
                <Link to={c.to} className="transition-colors hover:text-white">
                  {c.label}
                </Link>
                <ChevronRight size={12} aria-hidden="true" />
              </span>
            ))}
            <span className="text-white/90">{title}</span>
          </nav>
          {eyebrow && <div className="mb-2 text-xs font-bold tracking-[0.2em] text-gold-400 uppercase">{eyebrow}</div>}
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">{description}</p>}
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 px-5 py-10 sm:px-6 sm:py-12 ${width}`}>{children}</main>
      <Footer />
    </div>
  )
}
