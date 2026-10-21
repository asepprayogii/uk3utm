import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { todayWib } from '../../lib/sessions'
import { structureIssues } from '../../lib/committee'
import { ADMIN_GROUPS, ROLE_LABEL } from '../../lib/adminNav'
import { useAuth } from '../../hooks/useAuth'
import { useAsyncData } from '../../hooks/useAsyncData'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import { ErrorState, Loading } from '../../components/States'

const INITIAL = { counts: {}, committee: [], activeSessions: 0 }
const count = (table) => supabase.from(table).select('*', { count: 'exact', head: true })

async function fetchDashboard() {
  const keys = ['announcements', 'devotionals', 'album_photos', 'services', 'students', 'mentors']
  const results = await Promise.allSettled([
    ...keys.map((k) => count(k)),
    supabase.from('committee').select('*'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('archived', false).gte('date', todayWib()),
  ])
  const ok = results.map((r) => (r.status === 'fulfilled' && !r.value.error ? r.value : null))
  if (ok.every((r) => r === null)) throw new Error('Data dashboard gagal dimuat.')
  const counts = Object.fromEntries(keys.map((k, i) => [k, ok[i]?.count ?? 0]))
  const committee = ok[keys.length]?.data ?? []
  counts.committee = committee.length
  return { counts, committee, activeSessions: ok[keys.length + 1]?.count ?? 0 }
}

const STAT_KEYS = {
  '/admin/pengumuman': 'announcements', '/admin/renungan': 'devotionals', '/admin/kepengurusan': 'committee',
  '/admin/layanan': 'services', '/admin/galeri': 'album_photos', '/admin/mahasiswa': 'students', '/admin/kakak-bimbing': 'mentors',
}

export default function Dashboard() {
  const { profile, user } = useAuth()
  const role = profile?.role
  const { data, loading, error, retry } = useAsyncData(fetchDashboard, INITIAL)
  const { counts, committee, activeSessions } = data

  const todo = []
  if (['bph', 'infokom'].includes(role)) {
    if (!loading && !error) {
      for (const i of structureIssues(committee).filter((x) => !x.includes('foto'))) todo.push({ text: i, to: '/admin/kepengurusan', cta: 'Lengkapi' })
    }
  }
  if (['bph', 'pembinaan'].includes(role) && activeSessions > 0) {
    todo.push({ text: `${activeSessions} sesi absensi masih terbuka.`, to: '/admin/sesi', cta: 'Kelola sesi', info: true })
  }

  const name = (user?.email ?? '').split('@')[0]

  return (
    <AdminPage title={`Halo, ${name} 👋`} description={`Anda masuk sebagai ${ROLE_LABEL[role] ?? role}. Pilih menu di bawah untuk mulai mengelola.`}>
      {loading && <Loading />}
      {error && <ErrorState message="Ringkasan gagal dimuat." onRetry={retry} />}

      {!loading && !error && (
        <>
          <Card className="mb-8 p-5">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-brand-800 uppercase">Perlu perhatian</h2>
            {todo.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700"><CheckCircle2 size={18} /> Semua beres. Tidak ada yang perlu dilengkapi.</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {todo.map((t) => (
                  <li key={t.text} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${t.info ? 'bg-brand-50 text-brand-900' : 'bg-amber-50 text-amber-900'}`}>
                    <span className="flex items-center gap-2"><AlertTriangle size={16} className="shrink-0" /> {t.text}</span>
                    <Link to={t.to} className="shrink-0 font-bold underline-offset-2 hover:underline">{t.cta} →</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {ADMIN_GROUPS.filter((g) => g.label !== 'Ringkasan').map((g) => {
            const items = g.items.filter((i) => i.roles.includes(role))
            if (items.length === 0) return null
            return (
              <section key={g.label} className="mb-8">
                <h2 className="mb-3 text-sm font-bold tracking-wide text-ink-500 uppercase">{g.label}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(({ to, label, desc, icon: Icon }) => {
                    const n = counts[STAT_KEYS[to]]
                    return (
                      <Link key={to} to={to} className="group flex items-start gap-4 rounded-2xl border border-paper-300 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white"><Icon size={20} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-bold text-ink-900">{label}</span>
                            {n !== undefined && <span className="rounded-full bg-paper-100 px-2 py-0.5 text-xs font-bold text-ink-700">{n}</span>}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-500">{desc}</span>
                        </span>
                        <ArrowRight size={16} className="mt-1 shrink-0 text-ink-300 group-hover:text-brand-700" />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
          <p className="flex items-center gap-1 text-xs text-ink-400"><Plus size={12} /> Tip: tombol “Tambah” ada di pojok kanan atas setiap halaman.</p>
        </>
      )}
    </AdminPage>
  )
}
