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
    <div className="mb-8 text-center">
      <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">{children}</h2>
      {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      <div className="mx-auto mt-3 h-0.5 w-12 rounded bg-gold-400" aria-hidden="true" />
    </div>
  )
}

function Cards({ members, size = 'w-40 sm:w-48' }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {members.map((m) => (
        <div key={m.id} className={size}><MemberCard member={m} /></div>
      ))}
    </div>
  )
}

function DepartmentPanel({ dept }) {
  return (
    <div className="rounded-3xl border border-paper-300 bg-white p-5 shadow-soft sm:p-8">
      {dept.kadep.length > 0 && (
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 text-[11px] font-bold tracking-widest text-gold-700 uppercase">Kepala Departemen</div>
          <Cards members={dept.kadep} size="w-48 sm:w-56" />
        </div>
      )}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {dept.divisions.map((div) => (
          <div key={div.name}>
            <div className="mb-3 flex items-center gap-2 border-b border-paper-200 pb-2">
              <span className="text-sm font-bold text-brand-800">Divisi {div.name}</span>
              <span className="rounded-full bg-brand-50 px-2 text-xs font-semibold text-brand-700">{div.members.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {div.members.map((m) => <MemberCard key={m.id} member={m} variant="row" />)}
            </div>
          </div>
        ))}
        {dept.others.length > 0 && (
          <div>
            <div className="mb-3 border-b border-paper-200 pb-2 text-sm font-bold text-brand-800">Anggota</div>
            <div className="flex flex-col gap-2">
              {dept.others.map((m) => <MemberCard key={m.id} member={m} variant="row" />)}
            </div>
          </div>
        )}
      </div>
      {dept.kadep.length === 0 && dept.divisions.length === 0 && dept.others.length === 0 && (
        <p className="text-center text-sm text-ink-400">Belum ada anggota.</p>
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
      description="Kenali para pengurus yang melayani mahasiswa Kristen di Universitas Trunojoyo Madura."
      width="max-w-6xl"
    >
      {loading && <Loading />}
      {error && <ErrorState message="Data kepengurusan gagal dimuat." onRetry={retry} />}
      {empty && <EmptyState icon={Users} title="Belum ada data pengurus">Struktur pengurus akan tampil di sini.</EmptyState>}

      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col gap-20">
          {(g.pembina.length > 0 || g.pembimbing.length > 0) && (
            <section aria-labelledby="sec-pembina">
              <Title sub="Pendamping rohani dan akademik"><span id="sec-pembina">Pembina & Pembimbing</span></Title>
              <Cards members={[...g.pembina, ...g.pembimbing]} size="w-44 sm:w-52" />
            </section>
          )}

          {g.bph.length > 0 && (
            <section aria-labelledby="sec-bph">
              <Title sub="Badan Pengurus Harian"><span id="sec-bph">BPH</span></Title>
              {ketua.length > 0 && (
                <div className="flex flex-col items-center">
                  <Cards members={ketua} size="w-56 sm:w-64" />
                  {bphLain.length > 0 && <div className="h-8 w-px bg-gold-400/70" aria-hidden="true" />}
                </div>
              )}
              {bphLain.length > 0 && <Cards members={bphLain} />}
            </section>
          )}

          {g.departments.length > 0 && shown && (
            <section aria-labelledby="sec-dept">
              <Title sub="Pilih departemen untuk melihat anggotanya"><span id="sec-dept">Departemen</span></Title>
              <div role="tablist" aria-label="Departemen" className="mb-6 flex flex-wrap justify-center gap-2">
                {g.departments.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    role="tab"
                    aria-selected={shown.name === d.name}
                    onClick={() => setActive(d.name)}
                    className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
                      shown.name === d.name ? 'border-brand-700 bg-brand-700 text-white shadow-soft' : 'border-paper-300 bg-white text-ink-700 hover:bg-brand-50'
                    }`}
                  >
                    {d.name} <span className="opacity-60">{d.total}</span>
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
