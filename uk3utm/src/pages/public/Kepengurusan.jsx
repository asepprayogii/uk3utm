import { supabase } from '../../lib/supabase'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const DEPARTMENTS = ['Pembinaan', 'Dopiper', 'Penatalayanan', 'Minat Bakat']
const DIVISIONS = {
  Pembinaan: ['Kelompok Besar', 'Kelompok Kecil'],
  Dopiper: ['Doa', 'Penginjilan', 'Pemerhati'],
  Penatalayanan: ['Infokom', 'Inventaris'],
  'Minat Bakat': ['Creative Ministry', 'Musik', 'Olahraga'],
}

const BPH_ORDER = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara']
const EMPTY = []

function getAutoOrder(position = '', department, is_kadep) {
  if (department === 'Pembina') return 0
  if (department === 'Pembimbing') return 1
  if (department === 'BPH') {
    const idx = BPH_ORDER.findIndex((p) => position.toLowerCase().includes(p.toLowerCase()))
    return idx >= 0 ? 10 + idx : 14
  }
  if (is_kadep) return 20
  return 30
}

const fetchCommittee = () =>
  unwrap(supabase.from('committee').select('*')).then((rows) =>
    [...(rows ?? [])].sort((a, b) => {
      const oA = getAutoOrder(a.position, a.department, a.is_kadep)
      const oB = getAutoOrder(b.position, b.department, b.is_kadep)
      if (oA !== oB) return oA - oB
      return (a.name ?? '').localeCompare(b.name ?? '')
    }),
  )

const AVATAR_SIZES = {
  lg: 'w-20 h-20 text-2xl',
  xs: 'w-10 h-10 text-sm',
}

function Avatar({ member, size = 'xs' }) {
  const sz = AVATAR_SIZES[size]
  return member.photo_url ? (
    <img
      src={member.photo_url}
      alt={member.name}
      loading="lazy"
      className={`${sz} shrink-0 rounded-full border-2 border-gold-500/30 object-cover`}
    />
  ) : (
    <div
      aria-hidden="true"
      className={`${sz} flex shrink-0 items-center justify-center rounded-full border-2 border-gold-500/30 bg-gold-500/20`}
    >
      <span className="font-bold text-gold-500">{member.name?.[0] ?? '?'}</span>
    </div>
  )
}

// Kartu besar untuk Pembina, Pembimbing, dan BPH
function FeaturedCard({ member }) {
  return (
    <div className="min-w-[150px] rounded-2xl border-2 border-gold-500/30 bg-navy-800 p-6 text-center transition-colors hover:border-gold-500/60">
      <div className="mb-3 flex justify-center">
        <Avatar member={member} size="lg" />
      </div>
      <div className="mb-0.5 text-sm font-semibold">{member.name}</div>
      <div className="text-xs text-gold-500">{member.position}</div>
    </div>
  )
}

function MemberRow({ member, badge, indent = false }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-gold-500/10 bg-navy-800 p-3 transition-colors hover:border-gold-500/25 ${
        indent ? 'ml-6' : ''
      }`}
    >
      <Avatar member={member} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{member.name}</div>
        <div className="text-xs text-gold-500">{member.position}</div>
      </div>
      {badge && <span className="shrink-0 rounded-full bg-gold-500/10 px-2 py-0.5 text-xs text-gold-500">{badge}</span>}
    </div>
  )
}

function SectionTitle({ label }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-gold-500/10" />
      <h2 className="rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5 text-xs tracking-widest uppercase text-gold-500">
        {label}
      </h2>
      <div className="h-px flex-1 bg-gold-500/10" />
    </div>
  )
}

function VLine() {
  return (
    <div className="my-3 flex justify-center" aria-hidden="true">
      <div className="h-8 w-px bg-gold-500/20" />
    </div>
  )
}

function FeaturedGroup({ label, members, withLine }) {
  if (members.length === 0) return null
  return (
    <>
      <SectionTitle label={label} />
      <div className="mb-4 flex flex-wrap justify-center gap-4">
        {members.map((m) => (
          <FeaturedCard key={m.id} member={m} />
        ))}
      </div>
      {withLine && <VLine />}
    </>
  )
}

function Department({ dept, data }) {
  const { kadep, byDiv, members } = data
  const noDivision = members.filter((m) => !m.is_kadep && !m.division)

  return (
    <section className="pt-6" aria-label={`Departemen ${dept}`}>
      <div className="mb-4 text-center">
        <span className="rounded-full border border-gold-500/20 bg-navy-900 px-3 py-1.5 text-xs tracking-widest uppercase text-gold-500">
          {dept}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {kadep && <MemberRow member={kadep} badge="Kadep" />}

        {(DIVISIONS[dept] ?? []).map((div) => {
          const divMembers = byDiv[div] ?? []
          if (divMembers.length === 0) return null
          return (
            <div key={div}>
              <div className="my-2 flex items-center gap-2 pl-2">
                <div className="h-px w-3 bg-gold-500/20" />
                <span className="text-xs text-cream/40">{div}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {divMembers.map((m) => (
                  <MemberRow key={m.id} member={m} indent />
                ))}
              </div>
            </div>
          )
        })}

        {noDivision.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
    </section>
  )
}

export default function Kepengurusan() {
  const { data: committee, loading, error, retry } = useAsyncData(fetchCommittee, EMPTY)

  const pembina = committee.filter((c) => c.department === 'Pembina')
  const pembimbing = committee.filter((c) => c.department === 'Pembimbing')
  const bph = committee.filter((c) => c.department === 'BPH')

  const byDept = Object.fromEntries(
    DEPARTMENTS.map((dept) => {
      const members = committee.filter((c) => c.department === dept)
      const kadep = members.find((m) => m.is_kadep)
      const byDiv = Object.fromEntries(
        (DIVISIONS[dept] ?? []).map((div) => [div, members.filter((m) => !m.is_kadep && m.division === div)]),
      )
      return [dept, { kadep, byDiv, members }]
    }),
  )
  const activeDepts = DEPARTMENTS.filter((d) => byDept[d].members.length > 0)

  return (
    <PageLayout width="max-w-5xl">
      <PageHeader
        eyebrow="Struktur Organisasi"
        title="Kepengurusan UK3 UTM"
        subtitle="Periode 2025/2026"
        className="mb-14"
      />

      {loading && <Loading />}
      {error && <ErrorState message="Data kepengurusan gagal dimuat." onRetry={retry} />}
      {!loading && !error && committee.length === 0 && <EmptyState>Belum ada data kepengurusan.</EmptyState>}

      {!loading && !error && committee.length > 0 && (
        <div className="flex flex-col">
          <FeaturedGroup label="Pembina" members={pembina} withLine />
          <FeaturedGroup label="Pembimbing" members={pembimbing} withLine />
          <FeaturedGroup label="Badan Pengurus Harian" members={bph} withLine={activeDepts.length > 0} />

          {activeDepts.length > 0 && (
            <div className={`grid gap-x-8 gap-y-2 ${activeDepts.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {activeDepts.map((dept) => (
                <Department key={dept} dept={dept} data={byDept[dept]} />
              ))}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
