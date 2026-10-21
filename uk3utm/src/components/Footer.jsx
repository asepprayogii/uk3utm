import { Link } from 'react-router-dom'
import { PUBLIC_NAV } from '../lib/nav'
import { LogoMark } from './Logo'

export default function Footer() {
  return (
    <footer className="hero-bg pattern-cross text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <LogoMark size={64} alt="" />
            <div>
              <div className="text-lg font-extrabold tracking-wide">UK3 UTM</div>
              <div className="text-sm text-white/60">Persekutuan Doa Revive</div>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
            Unit Kegiatan Kerohanian Kristen Universitas Trunojoyo Madura. Wadah mahasiswa Kristen untuk bertumbuh dalam
            iman, persekutuan, dan pelayanan.
          </p>
        </div>

        <nav aria-label="Menu situs">
          <div className="mb-4 text-xs font-bold tracking-widest text-gold-400 uppercase">Jelajahi</div>
          <ul className="flex flex-col gap-2.5 text-sm">
            {PUBLIC_NAV.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/70 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <div className="mb-4 text-xs font-bold tracking-widest text-gold-400 uppercase">Pengurus</div>
          <p className="mb-4 text-sm leading-relaxed text-white/65">Kelola konten dan absensi melalui panel admin.</p>
          <Link
            to="/admin/login"
            className="inline-block rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Masuk Admin
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} UK3 UTM · Universitas Trunojoyo Madura
      </div>
    </footer>
  )
}
