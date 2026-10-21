import Avatar from '../ui/Avatar'

// Kartu pengurus: `featured` untuk Pembina/Pembimbing/BPH, `row` untuk anggota departemen.
export default function MemberCard({ member, variant = 'featured', highlight = false }) {
  if (variant === 'row') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-paper-300 bg-white p-3 transition-shadow hover:shadow-soft">
        <Avatar name={member.name} src={member.photo_url} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{member.name}</div>
          <div className="truncate text-xs text-ink-500">{member.position}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border bg-white text-center transition-shadow hover:shadow-lift ${
        highlight ? 'border-gold-400 p-7 shadow-soft' : 'border-paper-300 p-5'
      }`}
    >
      <Avatar name={member.name} src={member.photo_url} size={highlight ? '2xl' : 'xl'} ring={highlight} />
      <div className={`mt-4 font-bold text-ink-900 ${highlight ? 'text-lg' : 'text-sm'}`}>{member.name}</div>
      <div className="mt-1 text-xs font-semibold tracking-wide text-gold-700 uppercase">{member.position}</div>
    </div>
  )
}
