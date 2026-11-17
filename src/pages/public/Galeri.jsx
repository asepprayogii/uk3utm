import { useCallback, useState } from 'react'
import { Images } from 'lucide-react'
import { fetchPhotos } from '../../lib/gallery'
import { useAsyncData } from '../../hooks/useAsyncData'
import Lightbox from '../../components/Lightbox'
import PageLayout from '../../components/PageLayout'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const load = () => fetchPhotos()

export default function Galeri() {
  const { data: photos, loading, error, retry } = useAsyncData(load, EMPTY)
  const [index, setIndex] = useState(null)
  const close = useCallback(() => setIndex(null), [])

  return (
    <PageLayout eyebrow="Momen Bersama" title="Galeri" description="Dokumentasi kebersamaan kami dalam ibadah, pelayanan, dan kegiatan." width="max-w-6xl">
      {index !== null && <Lightbox photos={photos} index={index} onClose={close} onIndex={setIndex} />}
      {loading && <Loading />}
      {error && <ErrorState message="Foto gagal dimuat." onRetry={retry} />}
      {!loading && !error && photos.length === 0 && <EmptyState icon={Images} title="Belum ada foto">Foto kegiatan akan tampil di sini.</EmptyState>}
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setIndex(i)} aria-label={p.caption ? `Buka foto: ${p.caption}` : 'Buka foto'} className="group cursor-zoom-in text-left">
            <span className="block aspect-[4/3] overflow-hidden bg-paper-200">
              <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} loading="lazy" className="h-full w-full object-cover" />
            </span>
            <span className="mt-2 block border-t border-ink-900 pt-2 text-sm leading-snug font-semibold group-hover:text-brand-600">{p.caption || 'Foto kegiatan'}</span>
          </button>
        ))}
      </div>
    </PageLayout>
  )
}
