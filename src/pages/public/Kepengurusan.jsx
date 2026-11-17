import { useState } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { bphRank, groupCommittee } from '../../lib/committee'
import { currentPeriod } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import MemberCard from '../../components/committee/MemberCard'
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

function Cards({ members, highlight = false }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
      {members.map((m) => (
        <MemberCard key={m.id} member={m} highlight={highlight} />
      ))}
    </div>
  )
}

function DepartmentPanel({ dept }) {
  return (
    <div>
      {dept.kadep.length > 0 && (
        <div className="mb-10"><Cards members={dept.kadep} highlight /></div>
      )}
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {dept.divisions.map((div) => (
          <div key={div.name}>
            <div className="flex items-baseline justify-between border-b border-ink-900 pb-2">
              <span className="display text-xl">Divisi {div.name}</span>
              <span className="text-xs font-bold text-ink-500 tabular-nums">{div.members.length}</span>
            </div>
            {div.members.map((m) => <MemberCard key={m.id} member={m} variant="row" />)}
          </div>
        ))}
        {dept.others.length > 0 && (
          <div>
            <div className="border-b border-ink-900 pb-2"><span className="display text-xl">Anggota</span></div>
            {dept.others.map((m) => <MemberCard key={m.id} member={m} variant="row" />)}
          </div>
        )}
      </div>
      {dept.kadep.length === 0 && dept.divisions.length === 0 && dept.others.length === 0 && (
        <p className="text-sm text-ink-400">Belum ada anggota.</p>
      )}
    </div>
  )
}

export default function Kepengurusan() {
  const { data, loading, error, retry } = useAsyncData(fetchCommittee, EMPTY)
  const [active, setActive] = useState(null)
  const g = groupCommittee(data)
  const empty = !loading && !error && data.length === 0

  const ketua = g.bph.filter((m) => bphRank(m.position) < 110)
  const bphLain = g.bph.filter((m) => bphRank(m.position) >= 110)
  const shown = g.departments.find((d) => d.name === active) ?? g.departments[0]

  return (
    <PageLayout
      eyebrow={`Periode ${currentPeriod()}`}
      title="Kepengurusan"
      description="Kenali para pengurus yang melayani mahasiswa Kristen di Universitas Trunodjoyo Madura."
      width="max-w-6xl"
    >
      {loading && <Loading />}
      {error && <ErrorState message="Data kepengurusan gagal dimuat." onRetry={retry} />}
      {empty && <EmptyState icon={Users} title="Belum ada data pengurus">Struktur pengurus akan tampil di sini.</EmptyState>}

      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col gap-16 sm:gap-24">
          {(g.pembina.length > 0 || g.pembimbing.length > 0) && (
            <section aria-labelledby="sec-pembina">
              <Title sub="Pendamping rohani dan akademik"><span id="sec-pembina">Pembina & Pembimbing</span></Title>
              <Cards members={[...g.pembina, ...g.pembimbing]} highlight />
            </section>
          )}

          {g.bph.length > 0 && (
            <section aria-labelledby="sec-bph">
              <Title sub="Badan Pengurus Harian"><span id="sec-bph">BPH</span></Title>
              {ketua.length > 0 && <div className="mb-10"><Cards members={ketua} highlight /></div>}
              {bphLain.length > 0 && <Cards members={bphLain} />}
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
                    {d.name} <span className="text-ink-400">{d.total}</span>
                  </button>
                ))}
              </div>
              <div role="tabpanel"><DepartmentPanel dept={shown} /></div>
            </section>
          )}
        </div>
      )}
    </PageLayout>
  )
}
