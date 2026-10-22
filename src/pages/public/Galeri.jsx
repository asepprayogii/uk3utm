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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setIndex(i)} aria-label={p.caption ? `Buka foto: ${p.caption}` : 'Buka foto'} className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl bg-paper-200 text-left">
            <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {p.caption && <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-brand-950/85 via-brand-950/40 to-transparent px-3 pt-10 pb-3 text-sm leading-tight font-semibold text-white">{p.caption}</span>}
          </button>
        ))}
      </div>
    </PageLayout>
  )
}
