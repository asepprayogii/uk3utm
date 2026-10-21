import { Globe, MessageCircle, Music2 } from 'lucide-react'

// lucide tidak lagi menyediakan ikon merek, jadi Instagram, YouTube, dan Facebook digambar sederhana.
export default function SocialIcon({ platform, size = 20, className = '' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className, 'aria-hidden': true }
  switch (platform) {
    case 'instagram':
      return (<svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" /></svg>)
    case 'youtube':
      return (<svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" /></svg>)
    case 'facebook':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M13.5 20v-7h2.3l.4-2.7h-2.7V8.6c0-.8.3-1.3 1.4-1.3h1.4V5a15 15 0 0 0-2-.1c-2 0-3.4 1.2-3.4 3.5v1.9H8.6V13h2.3v7" /></svg>)
    case 'tiktok': return <Music2 size={size} className={className} aria-hidden="true" />
    case 'whatsapp': return <MessageCircle size={size} className={className} aria-hidden="true" />
    default: return <Globe size={size} className={className} aria-hidden="true" />
  }
}
