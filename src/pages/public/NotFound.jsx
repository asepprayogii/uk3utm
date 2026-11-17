import PageLayout from '../../components/PageLayout'
import Button from '../../components/ui/Button'

export default function NotFound() {
  return (
    <PageLayout title="Halaman tidak ditemukan" eyebrow="Galat 404" width="max-w-3xl">
      <p className="max-w-md leading-relaxed text-ink-700">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
      <div className="mt-8">
        <Button to="/" variant="primary" size="lg">Kembali ke Beranda</Button>
      </div>
    </PageLayout>
  )
}
