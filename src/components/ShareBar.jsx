import { Link2, MessageCircle, Share2 } from 'lucide-react'
import { useUI } from '../hooks/useUI'
import Button from './ui/Button'
import { copyText, fullUrl } from '../lib/share'

// Tombol bagikan: salin link, kirim ke WhatsApp, dan menu bagikan bawaan ponsel (jika ada).
// Pratinjau yang muncul di WhatsApp mengikuti halaman yang dibagikan (judul, ringkasan, gambar).
export default function ShareBar({ path, title }) {
  const { toast } = useUI()
  const url = fullUrl(path)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    if (await copyText(url)) toast.success('Link disalin.')
    else toast.error('Gagal menyalin link.')
  }
  async function share() {
    try { await navigator.share({ title, url }) } catch { /* dibatalkan pengguna */ }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <span className="kicker mr-1">Bagikan</span>
      <Button size="sm" variant="secondary" icon={Link2} onClick={copy}>Salin link</Button>
      <Button size="sm" variant="secondary" icon={MessageCircle} href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</Button>
      {canShare && <Button size="sm" variant="secondary" icon={Share2} onClick={share}>Lainnya</Button>}
    </div>
  )
}
