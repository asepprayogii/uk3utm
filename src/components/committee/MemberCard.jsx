import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FIXED_GROUPS, roleLabel } from '../../lib/committee'
import Avatar from '../ui/Avatar'
import Lightbox from '../Lightbox'
import Reveal from '../Reveal'

// Semua pengurus memakai kartu yang sama besar. Bila punya foto, kartu bisa diketuk untuk memperbesar foto.
function Card({ member, onOpen }) {
  const clickable = !!member.photo_url && !!onOpen
  // Anggota departemen/divisi tidak perlu diberi label "Anggota"; keterangannya sudah jelas dari bagian halamannya (BPH, Pembina, dll. tetap ada).
  const plainMember = !FIXED_GROUPS.includes(member.department) && member.position === 'Anggota'
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
      {!plainMember && <div className="kicker mt-2">{member.position}</div>}
    </div>
  )
}

// Kumpulan kartu pengurus. Pratinjau foto bisa digeser ke seluruh pengurus di `all` (urutan baca), bukan hanya kartu di grid ini.
export default function MemberGrid({ members, all, linkTo, className = 'grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4' }) {
  const [index, setIndex] = useState(null)
  const withPhoto = useMemo(
    () => (all ?? members).filter((m) => m.photo_url).map((m) => ({ id: m.id, photo_url: m.photo_url, caption: `${m.name} — ${roleLabel(m)}` })),
    [all, members],
  )
  const close = useCallback(() => setIndex(null), [])

  return (
    <>
      {index !== null && withPhoto[index] && <Lightbox photos={withPhoto} index={index} onClose={close} onIndex={setIndex} />}
      <div className={className}>
        {members.map((m, i) => (
          <Reveal key={m.id} delay={(i % 4) * 60}>
            {linkTo ? (
              <Link to={linkTo} aria-label={`${m.name}, lihat halaman kepengurusan`} className="block"><Card member={m} /></Link>
            ) : (
              <Card member={m} onOpen={() => setIndex(withPhoto.findIndex((p) => p.id === m.id))} />
            )}
          </Reveal>
        ))}
      </div>
    </>
  )
}
