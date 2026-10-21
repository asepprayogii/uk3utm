import { Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { groupCommittee } from '../../lib/committee'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import MemberCard from '../../components/committee/MemberCard'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchCommittee = () => unwrap(supabase.from('committee').select('*')).then((rows) => rows ?? [])

function GroupTitle({ children, sub }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="font-display text-3xl font-bold text-brand-900">{children}</h2>
      {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      <div className="mx-auto mt-3 h-0.5 w-12 rounded bg-gold-400" aria-hidden="true" />
    </div>
  )
}

function Grid({ members, highlightFirst = false }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {members.map((m, i) => (
        <div key={m.id} className={highlightFirst && i === 0 ? 'w-full max-w-xs' : 'w-full max-w-[220px]'}>
          <MemberCard member={m} highlight={highlightFirst && i === 0} />
        </div>
      ))}
    </div>
  )
}

export default function Kepengurusan() {
  const { data, loading, error, retry } = useAsyncData(fetchCommittee, EMPTY)
  const g = groupCommittee(data)
  const isEmpty = !loading && !error && data.length === 0
  const hasKetua = g.bph[0] && /ketua/i.test(g.bph[0].position ?? '') && !/wakil/i.test(g.bph[0].position ?? '')

  return (
    <PageLayout
      eyebrow="Siapa Kami"
      title="Kepengurusan"
      description="Para pengurus yang melayani mahasiswa Kristen di Universitas Trunojoyo Madura."
      width="max-w-6xl"
    >
      {loading && <Loading />}
      {error && <ErrorState message="Data kepengurusan gagal dimuat." onRetry={retry} />}
      {isEmpty && <EmptyState icon={Users} title="Belum ada data pengurus">Struktur pengurus akan tampil di sini.</EmptyState>}

      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col gap-16">
          {(g.pembina.length > 0 || g.pembimbing.length > 0) && (
            <section>
              <GroupTitle sub="Pendamping rohani dan akademik">Pembina & Pembimbing</GroupTitle>
              <Grid members={[...g.pembina, ...g.pembimbing]} />
            </section>
          )}

          {g.bph.length > 0 && (
            <section>
              <GroupTitle sub="Badan Pengurus Harian">BPH</GroupTitle>
              <Grid members={g.bph} highlightFirst={hasKetua} />
            </section>
          )}

          {g.departments.length > 0 && (
            <section>
              <GroupTitle sub="Pelayanan dijalankan melalui departemen dan divisi">Departemen</GroupTitle>
              <div className="grid gap-6 md:grid-cols-2">
                {g.departments.map((d) => (
                  <article key={d.name} className="overflow-hidden rounded-2xl border border-paper-300 bg-white shadow-soft">
                    <header className="hero-bg flex items-center justify-between px-5 py-4 text-white">
                      <h3 className="font-display text-2xl font-bold">{d.name}</h3>
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">{d.total} orang</span>
                    </header>
                    <div className="flex flex-col gap-5 p-5">
                      {d.kadep.map((m) => (
                        <div key={m.id}>
                          <div className="mb-2 text-[11px] font-bold tracking-widest text-gold-700 uppercase">Kepala Departemen</div>
                          <MemberCard member={m} variant="row" />
                        </div>
                      ))}
                      {d.divisions.map((div) => (
                        <div key={div.name}>
                          <div className="mb-2 text-[11px] font-bold tracking-widest text-brand-600 uppercase">Divisi {div.name}</div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {div.members.map((m) => (
                              <MemberCard key={m.id} member={m} variant="row" />
                            ))}
                          </div>
                        </div>
                      ))}
                      {d.others.length > 0 && (
                        <div>
                          <div className="mb-2 text-[11px] font-bold tracking-widest text-ink-500 uppercase">Anggota lainnya</div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {d.others.map((m) => (
                              <MemberCard key={m.id} member={m} variant="row" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageLayout>
  )
}
