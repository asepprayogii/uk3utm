import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'

export default function NotFound() {
  return (
    <PageLayout width="max-w-xl">
      <div className="py-16 text-center">
        <div className="font-display text-7xl font-bold text-gold-500/80">404</div>
        <h1 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-cream/50">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </PageLayout>
  )
}
