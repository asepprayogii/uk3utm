import { Link } from 'react-router-dom'
import { PUBLIC_NAV } from '../lib/nav'
import { LogoMark } from './Logo'

export default function Footer() {
  return (
    <footer className="border-t border-ink-900 bg-paper-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-6">
          <div className="display text-5xl sm:text-6xl">UK3 UTM</div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-700">
            Unit Kegiatan Kerohanian Kristen Universitas Trunodjoyo Madura, Persekutuan Doa Revive.
          </p>
          <LogoMark size={44} alt="" className="mt-6" />
        </div>

        <nav aria-label="Menu situs" className="md:col-span-3 md:col-start-8">
          <div className="kicker mb-4">Jelajahi</div>
          <ul className="flex flex-col gap-2.5 text-sm font-semibold">
            {PUBLIC_NAV.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-brand-600">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2">
          <div className="kicker mb-4">Pengurus</div>
          <Link to="/admin/login" className="text-sm font-semibold underline underline-offset-4 hover:text-brand-600">Masuk Admin</Link>
        </div>
      </div>

      <div className="border-t border-paper-300 px-5 py-5 text-center text-xs text-ink-500 sm:px-6">
        © {new Date().getFullYear()} UK3 UTM · Universitas Trunodjoyo Madura
      </div>
    </footer>
  )
}
