import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { parseVideo } from '../lib/video'

export default function Lightbox({ photos, index, onClose, onIndex }) {
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
  const video = parseVideo(p.photo_url)
  const btn = 'absolute flex h-11 w-11 items-center justify-center bg-white/10 text-white transition-colors hover:bg-white/25'
  // Lewat portal ke <body>: bila induknya punya transform (animasi muncul), `fixed` akan salah ukuran/posisi.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Pratinjau foto" className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/95 p-4" onClick={onClose}>
      <figure className="flex max-h-full max-w-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {video ? (
          <iframe
            key={video.id}
            src={video.embed}
            title={p.caption || 'Video kegiatan'}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="aspect-video w-[min(92vw,960px)] max-h-[75vh] border-0 bg-black"
          />
        ) : (
          <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} className="max-h-[80vh] max-w-full object-contain" />
        )}
        <figcaption className="mt-3 text-center text-sm text-white/75">
          {p.caption && <div className="mb-1 text-base font-semibold text-white">{p.caption}</div>}
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
    </div>,
    document.body,
  )
}
