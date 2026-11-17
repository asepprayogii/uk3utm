import Avatar from '../ui/Avatar'

// `featured`: potret besar dengan nama serif (Pembina/Pembimbing/BPH). `row`: baris rapat untuk anggota departemen.
export default function MemberCard({ member, variant = 'featured', highlight = false }) {
  if (variant === 'row') {
    return (
      <div className="flex items-center gap-3 border-b border-paper-300 py-3">
        <Avatar name={member.name} src={member.photo_url} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{member.name}</div>
          <div className="truncate text-xs text-ink-500">{member.position}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col border-t pt-4 ${highlight ? 'border-brand-600' : 'border-ink-900'}`}>
      <Avatar name={member.name} src={member.photo_url} size="fill" />
      <div className={`display mt-4 ${highlight ? 'text-3xl' : 'text-xl'}`}>{member.name}</div>
      <div className="kicker mt-2">{member.position}</div>
    </div>
  )
}
