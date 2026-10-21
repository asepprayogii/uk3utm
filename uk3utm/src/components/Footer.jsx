import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/pengumuman', label: 'Pengumuman' },
  { to: '/renungan', label: 'Renungan' },
  { to: '/kepengurusan', label: 'Kepengurusan' },
  { to: '/album', label: 'Album' },
  { to: '/layanan', label: 'Layanan' },
]

export default function Footer() {
  return (
    <footer className="border-t border-gold-500/10 bg-navy-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex flex-col items-center gap-3 md:flex-row">
          <img src="/logo-uk3.png" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
          <div>
            <div className="text-sm font-semibold tracking-wide">UK3 UTM</div>
            <div className="text-xs text-cream/40">Unit Kegiatan Kerohanian Kristen Universitas Trunojoyo Madura</div>
          </div>
        </div>

        <nav aria-label="Tautan footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-cream/50">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="transition-colors hover:text-gold-500">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-gold-500/5 py-4 text-center text-xs text-cream/30">
        © {new Date().getFullYear()} UK3 UTM. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  )
}
