import { useState } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { groupCommittee, orderedMembers } from '../../lib/committee'
import { currentPeriod } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import MemberGrid from '../../components/committee/MemberCard'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchCommittee = () => unwrap(supabase.from('committee').select('*')).then((rows) => rows ?? [])

function Title({ children, sub }) {
  return (
    <div className="mb-8 border-t border-ink-900 pt-4">
      <h2 className="display text-4xl sm:text-5xl">{children}</h2>
      {sub && <p className="mt-2 text-sm text-ink-500">{sub}</p>}
    </div>
  )
}

function DepartmentPanel({ dept, all }) {
  const groups = [
    ...dept.divisions.map((d) => ({ title: `Divisi ${d.name}`, members: d.members })),
    ...(dept.others.length > 0 ? [{ title: null, members: dept.others }] : []),
  ]
  return (
    <div className="flex flex-col gap-12">
      {dept.kadep.length > 0 && <MemberGrid members={dept.kadep} all={all} />}
      {groups.map((g) => (
        <div key={g.title ?? 'lainnya'}>
          {g.title && (
            <div className="mb-6 border-b border-ink-900 pb-2">
              <h3 className="display text-2xl">{g.title}</h3>
            </div>
          )}
          <MemberGrid members={g.members} all={all} />
        </div>
      ))}
      {dept.kadep.length === 0 && groups.length === 0 && <p className="text-sm text-ink-400">Belum ada anggota.</p>}
    </div>
  )
}

export default function Kepengurusan() {
  const { data, loading, error, retry } = useAsyncData(fetchCommittee, EMPTY, { live: true })
  const [active, setActive] = useState(null)
  const g = groupCommittee(data)
  const all = orderedMembers(g)
  const empty = !loading && !error && data.length === 0

  const shown = g.departments.find((d) => d.name === active) ?? g.departments[0]

  return (
    <PageLayout
      eyebrow={`Periode ${currentPeriod()}`}
      title="Kepengurusan"
      description="Kenali para pengurus yang melayani mahasiswa Kristen di Universitas Trunodjoyo Madura."
    >
      {loading && <Loading />}
      {error && <ErrorState message="Data kepengurusan gagal dimuat." onRetry={retry} />}
      {empty && <EmptyState icon={Users} title="Belum ada data pengurus">Struktur pengurus akan tampil di sini.</EmptyState>}

      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col gap-16 sm:gap-24">
          {(g.pembina.length > 0 || g.pembimbing.length > 0) && (
            <section aria-labelledby="sec-pembina">
              <Title sub="Pendamping rohani dan akademik"><span id="sec-pembina">Pembina & Pembimbing</span></Title>
              <MemberGrid members={[...g.pembina, ...g.pembimbing]} all={all} />
            </section>
          )}

          {g.bph.length > 0 && (
            <section aria-labelledby="sec-bph">
              <Title sub="Badan Pengurus Harian"><span id="sec-bph">BPH</span></Title>
              <MemberGrid members={g.bph} all={all} />
            </section>
          )}

          {g.departments.length > 0 && shown && (
            <section aria-labelledby="sec-dept">
              <Title sub="Pilih departemen untuk melihat anggotanya"><span id="sec-dept">Departemen</span></Title>
              <div role="tablist" aria-label="Departemen" className="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-paper-300">
                {g.departments.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    role="tab"
                    aria-selected={shown.name === d.name}
                    onClick={() => setActive(d.name)}
                    className={`-mb-px border-b-2 px-1 py-2 text-sm font-semibold transition-colors ${
                      shown.name === d.name ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-700 hover:border-ink-900'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              <div role="tabpanel"><DepartmentPanel dept={shown} all={all} /></div>
            </section>
          )}
        </div>
      )}
    </PageLayout>
  )
}
