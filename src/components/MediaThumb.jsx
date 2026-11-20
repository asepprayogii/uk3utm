import { useState } from 'react'
import { Play } from 'lucide-react'
import { parseVideo } from '../lib/video'

/**
 * Gambar sampul untuk satu item galeri. Video diberi lencana putar;
 * bila sampul video tidak bisa dimuat (mis. file Drive belum dibagikan) tampil latar gelap bergambar putar.
 */
export default function MediaThumb({ item, className = 'h-full w-full object-cover', alt }) {
  const video = parseVideo(item.photo_url)
  const [failed, setFailed] = useState(false)
  if (!video) return <img src={item.photo_url} alt={alt ?? item.caption ?? ''} loading="lazy" className={className} />
  return (
    <span className="relative block h-full w-full bg-ink-900">
      {!failed && <img src={video.thumb} alt={alt ?? item.caption ?? ''} loading="lazy" onError={() => setFailed(true)} className={className} />}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center bg-paper-50 text-ink-900 transition-colors group-hover:bg-brand-600 group-hover:text-paper-50"><Play size={20} fill="currentColor" aria-hidden="true" /></span>
      </span>
      <span className="kicker absolute bottom-2 left-2 bg-paper-50 px-1.5 py-0.5 !text-ink-900">Video</span>
    </span>
  )
}
