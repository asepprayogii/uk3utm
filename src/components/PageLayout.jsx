import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

// Halaman dalam: kepala majalah, judul sangat besar di grid asimetris, garis tipis, konten, footer.
export default function PageLayout({ title, eyebrow, description, crumbs = [], crumbLabel, width = 'max-w-5xl', children }) {
  // Judul tab browser mengikuti halaman, supaya mudah dikenali saat banyak tab terbuka.
  useEffect(() => {
    document.title = `${title} — UK3 UTM`
  }, [title])

  return (
    <div className="flex min-h-screen flex-col bg-paper-50 text-ink-900">
      <a href="#konten" className="sr-only z-[100] bg-paper-50 px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Lewati ke konten</a>
      <Navbar />

      <header className="border-b border-ink-900">
        <div className={`animate-page-in mx-auto px-5 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-14 ${width}`}>
          <nav aria-label="Lokasi halaman" className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider text-ink-500 uppercase sm:mb-12">
            <Link to="/" className="hover:text-brand-600">Beranda</Link>
            {crumbs.map((c) => (
              <span key={c.to} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <Link to={c.to} className="hover:text-brand-600">{c.label}</Link>
              </span>
            ))}
            <span aria-hidden="true">/</span>
            <span className="text-ink-900">{crumbLabel ?? title}</span>
          </nav>
          <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-10">
            <div className="md:col-span-8">
              {eyebrow && <div className="kicker mb-4">{eyebrow}</div>}
              <h1 className="display text-[2.6rem] sm:text-6xl lg:text-7xl">{title}</h1>
            </div>
            {description && <p className="max-w-sm text-[15px] leading-relaxed text-ink-700 md:col-span-4 md:col-start-9">{description}</p>}
          </div>
        </div>
      </header>

      <main id="konten" style={{ animationDelay: '80ms' }} className={`animate-page-in mx-auto w-full flex-1 px-5 py-10 sm:px-6 sm:py-14 ${width}`}>{children}</main>
      <Footer />
    </div>
  )
}
