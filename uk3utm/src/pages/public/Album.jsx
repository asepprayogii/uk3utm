import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Images, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []

const fetchAlbums = () =>
  unwrap(supabase.from('albums').select('*').order('event_date', { ascending: false })).then(
    (rows) => rows ?? [],
  )

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau foto"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Foto kegiatan"
        className="max-h-full max-w-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup pratinjau"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={20} />
      </button>
    </div>
  )
}

function AlbumPhotos({ album, onBack }) {
  const [lightbox, setLightbox] = useState(null)
  const closeLightbox = useCallback(() => setLightbox(null), [])

  const fetchPhotos = useCallback(
    () =>
      unwrap(supabase.from('album_photos').select('*').eq('album_id', album.id).order('order_index')).then(
        (rows) => rows ?? [],
      ),
    [album.id],
  )
  const { data: photos, loading, error, retry } = useAsyncData(fetchPhotos, EMPTY)

  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={closeLightbox} />}

      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gold-500 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Kembali ke Album
      </button>

      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold">{album.title}</h1>
        {album.event_date && (
          <div className="text-sm text-cream/40">
            {formatDate(album.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        {album.description && <p className="mt-3 text-sm leading-relaxed text-cream/60">{album.description}</p>}
      </div>

      {loading && <Loading />}
      {error && <ErrorState message="Foto gagal dimuat." onRetry={retry} />}
      {!loading && !error && photos.length === 0 && <EmptyState>Belum ada foto.</EmptyState>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setLightbox(p.photo_url)}
            className="group aspect-square cursor-zoom-in overflow-hidden rounded-xl"
          >
            <img
              src={p.photo_url}
              alt={p.caption || `Foto ${album.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
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
    <PageLayout width="max-w-5xl">
      {selected ? (
        <AlbumPhotos album={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <PageHeader eyebrow="Momen Bersama" title="Album Kegiatan" className="mb-10" />

          {loading && <Loading />}
          {error && <ErrorState message="Album gagal dimuat." onRetry={retry} />}
          {!loading && !error && albums.length === 0 && <EmptyState>Belum ada album.</EmptyState>}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {albums.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className="group overflow-hidden rounded-2xl border border-gold-500/10 bg-navy-800 text-left transition-colors hover:border-gold-500/40"
              >
                {a.cover_url ? (
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={a.cover_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-gold-500/5">
                    <Images size={36} className="text-gold-500/40" aria-hidden="true" />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="mb-1 line-clamp-1 text-sm font-semibold">{a.title}</h2>
                  {a.event_date && <div className="text-xs text-cream/40">{formatDate(a.event_date)}</div>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}
