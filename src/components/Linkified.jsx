import { linkify, shortLabel } from '../lib/linkify'

const LINK = 'break-words text-brand-700 underline decoration-brand-600/40 underline-offset-[3px] transition-colors hover:text-brand-600 hover:decoration-brand-600 [overflow-wrap:anywhere]'

// Teks bebas dengan tautan yang otomatis bisa diklik. Jangan dipakai di dalam <a> lain (kartu yang sudah berupa tautan).
export default function Linkified({ text }) {
  return linkify(text).map((p, i) =>
    p.href ? (
      <a key={i} href={p.href} target="_blank" rel="noopener noreferrer nofollow ugc" title={p.text} className={LINK}>
        {p.href.startsWith('mailto:') ? p.text : shortLabel(p.text)}
      </a>
    ) : (
      p.text
    ),
  )
}
