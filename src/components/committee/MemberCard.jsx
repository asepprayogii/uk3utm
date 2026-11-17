import { useCallback, useMemo, useState } from 'react'
import Avatar from '../ui/Avatar'
import Lightbox from '../Lightbox'
import Reveal from '../Reveal'

// Semua pengurus memakai kartu yang sama besar. Bila punya foto, kartu bisa diketuk untuk memperbesar foto.
function Card({ member, onOpen }) {
  const clickable = !!member.photo_url && !!onOpen
  const portrait = <Avatar name={member.name} src={member.photo_url} size="fill" />
  return (
    <div className="flex flex-col border-t border-ink-900 pt-4">
      {clickable ? (
        <button type="button" onClick={onOpen} aria-label={`Perbesar foto ${member.name}`} className="block cursor-zoom-in text-left">
          {portrait}
        </button>
      ) : (
        portrait
      )}
      <div className="display mt-4 text-xl">{member.name}</div>
      <div className="kicker mt-2">{member.position}</div>
    </div>
  )
}

// Kumpulan kartu pengurus dengan satu pratinjau foto yang bisa digeser antar pengurus.
export default function MemberGrid({ members, className = 'grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4' }) {
  const [index, setIndex] = useState(null)
  const withPhoto = useMemo(
    () => members.filter((m) => m.photo_url).map((m) => ({ id: m.id, photo_url: m.photo_url, caption: `${m.name} — ${m.position}` })),
    [members],
  )
  const close = useCallback(() => setIndex(null), [])

  return (
    <>
      {index !== null && withPhoto[index] && <Lightbox photos={withPhoto} index={index} onClose={close} onIndex={setIndex} />}
      <div className={className}>
        {members.map((m, i) => (
          <Reveal key={m.id} delay={(i % 4) * 60}>
            <Card member={m} onOpen={() => setIndex(withPhoto.findIndex((p) => p.id === m.id))} />
          </Reveal>
        ))}
      </div>
    </>
  )
}
