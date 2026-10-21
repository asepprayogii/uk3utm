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
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setIndex(i)} className="group mb-3 block w-full cursor-zoom-in overflow-hidden rounded-xl bg-paper-200">
            <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} loading="lazy" className="w-full transition-transform duration-300 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    </PageLayout>
  )
}
