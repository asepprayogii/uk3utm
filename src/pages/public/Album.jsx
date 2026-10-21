import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Images, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchAlbums = () =>
  unwrap(supabase.from('albums').select('*').order('event_date', { ascending: false })).then((rows) => rows ?? [])

function Lightbox({ photos, index, onClose, onIndex }) {
  const total = photos.length
  const go = useCallback((d) => onIndex((index + d + total) % total), [index, total, onIndex])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, go])

  const p = photos[index]
  const btn = 'absolute flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25'
  return (
    <div role="dialog" aria-modal="true" aria-label="Pratinjau foto" className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-950/95 p-4" onClick={onClose}>
      <figure className="flex max-h-full max-w-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} className="max-h-[80vh] max-w-full rounded-xl object-contain" />
        <figcaption className="mt-3 text-center text-sm text-white/75">
          {p.caption && <div className="mb-1">{p.caption}</div>}
          <span className="text-xs text-white/50">{index + 1} / {total}</span>
        </figcaption>
      </figure>
      <button type="button" onClick={onClose} aria-label="Tutup pratinjau" className={`${btn} top-4 right-4`}><X size={20} /></button>
      {total > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="Foto sebelumnya" className={`${btn} left-3 top-1/2 -translate-y-1/2`}><ChevronLeft size={22} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="Foto berikutnya" className={`${btn} right-3 top-1/2 -translate-y-1/2`}><ChevronRight size={22} /></button>
        </>
      )}
    </div>
  )
}

function AlbumPhotos({ album, onBack }) {
  const [index, setIndex] = useState(null)
  const closeLightbox = useCallback(() => setIndex(null), [])
  const fetchPhotos = useCallback(
    () => unwrap(supabase.from('album_photos').select('*').eq('album_id', album.id).order('order_index')).then((rows) => rows ?? []),
    [album.id],
  )
  const { data: photos, loading, error, retry } = useAsyncData(fetchPhotos, EMPTY)

  return (
    <>
      {index !== null && <Lightbox photos={photos} index={index} onClose={closeLightbox} onIndex={setIndex} />}
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Semua album
      </button>
      <div className="mb-8">
        <h2 className="font-display text-4xl font-bold text-brand-900">{album.title}</h2>
        {album.event_date && (
          <div className="mt-1 text-sm text-gold-700">{formatDate(album.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        )}
        {album.description && <p className="mt-3 max-w-2xl text-ink-700">{album.description}</p>}
      </div>

      {loading && <Loading />}
      {error && <ErrorState message="Foto gagal dimuat." onRetry={retry} />}
      {!loading && !error && photos.length === 0 && <EmptyState icon={Images} title="Belum ada foto">Foto album ini belum ditambahkan.</EmptyState>}

      <div className="columns-2 gap-3 md:columns-3">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setIndex(i)} className="group mb-3 block w-full cursor-zoom-in overflow-hidden rounded-xl bg-paper-200">
            <img src={p.photo_url} alt={p.caption || `Foto ${album.title}`} loading="lazy" className="w-full transition-transform duration-300 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    </>
  )
}

export default function Album() {
  const { data: albums, loading, error, retry } = useAsyncData(fetchAlbums, EMPTY)
  const [selected, setSelected] = useState(null)

  return (
    <PageLayout
      eyebrow="Momen Bersama"
      title="Album Kegiatan"
      description="Dokumentasi kebersamaan kami dalam ibadah, pelayanan, dan kegiatan."
      width="max-w-6xl"
    >
      {selected ? (
        <AlbumPhotos album={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          {loading && <Loading />}
          {error && <ErrorState message="Album gagal dimuat." onRetry={retry} />}
          {!loading && !error && albums.length === 0 && <EmptyState icon={Images} title="Belum ada album">Album kegiatan akan tampil di sini.</EmptyState>}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {albums.map((a) => (
              <button key={a.id} type="button" onClick={() => { setSelected(a); window.scrollTo({ top: 0 }) }} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-900 text-left">
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Images size={40} className="text-white/30" aria-hidden="true" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="line-clamp-2 font-bold">{a.title}</h3>
                  {a.event_date && <div className="mt-0.5 text-xs text-white/65">{formatDate(a.event_date)}</div>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}
