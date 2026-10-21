import PageLayout from '../../components/PageLayout'
import Button from '../../components/ui/Button'

export default function NotFound() {
  return (
    <PageLayout title="Halaman tidak ditemukan" eyebrow="Error 404" width="max-w-xl">
      <div className="py-8 text-center">
        <p className="text-ink-500">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
        <div className="mt-8">
          <Button to="/" variant="primary" size="lg">Kembali ke Beranda</Button>
        </div>
      </div>
    </PageLayout>
  )
}
