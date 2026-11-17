import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { friendlyError } from '../../lib/errors'
import { currentPeriod } from '../../lib/format'
import { DEFAULT_ABOUT, fetchContent, parseActivities, saveContent } from '../../lib/siteContent'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage from '../../components/admin/AdminPage'
import Button from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Field'
import { ErrorState, Loading } from '../../components/States'

const EMPTY = {}
const BLANK = { title: '', description: '' }
const MAX_ACTIVITIES = 12
const ABOUT_SOFT_LIMIT = 280

export default function ManageAbout() {
  const { data, loading, error, retry } = useAsyncData(fetchContent, EMPTY)
  if (loading) return <AdminPage title="Tentang UK3"><Loading /></AdminPage>
  if (error) return <AdminPage title="Tentang UK3"><ErrorState message="Data gagal dimuat." onRetry={retry} /></AdminPage>
  return <AboutForm initial={data} />
}

function Step({ n, title, children }) {
  return (
    <section className="border-t border-ink-900 pt-5">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-xs font-bold text-brand-600 tabular-nums">{String(n).padStart(2, '0')}</span>
        <h2 className="font-display text-2xl font-bold text-ink-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

// Dipisah agar formulir diisi sekali dari data yang sudah termuat (tanpa efek untuk menyalin state).
function AboutForm({ initial }) {
  const { toast } = useUI()
  const snapshot = () => ({
    about: initial.about ?? DEFAULT_ABOUT,
    founded: initial.founded ?? '',
    history: initial.history ?? '',
    activities: parseActivities(initial.activities),
  })
  const [saved, setSaved] = useState(snapshot)
  const [about, setAbout] = useState(saved.about)
  const [founded, setFounded] = useState(saved.founded)
  const [history, setHistory] = useState(saved.history)
  const [activities, setActivities] = useState(saved.activities.length ? saved.activities : [BLANK])
  const [saving, setSaving] = useState(false)

  const cleaned = useMemo(
    () => activities.map((a) => ({ title: a.title.trim(), description: a.description.trim() })).filter((a) => a.title),
    [activities],
  )
  const dirty = useMemo(
    () => about.trim() !== saved.about.trim() || founded.trim() !== saved.founded.trim() || history.trim() !== saved.history.trim() || JSON.stringify(cleaned) !== JSON.stringify(saved.activities),
    [about, founded, history, cleaned, saved],
  )

  // Peringatan bila halaman ditutup saat masih ada perubahan yang belum disimpan.
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const setAct = (i, patch) => setActivities((list) => list.map((a, k) => (k === i ? { ...a, ...patch } : a)))
  const move = (i, d) => setActivities((list) => {
    const j = i + d
    if (j < 0 || j >= list.length) return list
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  function reset() {
    setAbout(saved.about)
    setFounded(saved.founded)
    setHistory(saved.history)
    setActivities(saved.activities.length ? saved.activities : [BLANK])
  }

  async function save(e) {
    e.preventDefault()
    if (!dirty) return
    setSaving(true)
    try {
      await saveContent('about', about.trim())
      await saveContent('founded', founded.trim())
      await saveContent('history', history.trim())
      await saveContent('activities', JSON.stringify(cleaned))
      setSaved({ about: about.trim(), founded: founded.trim(), history: history.trim(), activities: cleaned })
      setActivities(cleaned.length ? cleaned : [BLANK])
      toast.success('Halaman Tentang disimpan.')
    } catch (err) {
      toast.error(friendlyError(err, 'menyimpan'))
    } finally {
      setSaving(false)
    }
  }

  const aboutOver = about.trim().length > ABOUT_SOFT_LIMIT

  return (
    <AdminPage
      title="Tentang UK3"
      description="Isi halaman Tentang di website. Bagian yang dikosongkan tidak ditampilkan. Visi, misi, dan sosmed tampil otomatis."
      action={<a href="/tentang" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800">Lihat halaman <ExternalLink size={14} aria-hidden="true" /></a>}
    >
      <form id="about-form" onSubmit={save} className="grid gap-10 pb-24 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <div className="flex flex-col gap-10">
          <Step n={1} title="Pengantar">
            <Textarea label="Apa itu UK3?" rows={3} hint="Satu atau dua kalimat. Juga tampil di beranda." value={about} onChange={(e) => setAbout(e.target.value)} />
            <div className={`mt-1 text-right text-xs tabular-nums ${aboutOver ? 'font-semibold text-red-700' : 'text-ink-400'}`}>{about.trim().length}/{ABOUT_SOFT_LIMIT}{aboutOver && ' — sebaiknya lebih singkat'}</div>
          </Step>

          <Step n={2} title="Sejarah">
            <div className="flex flex-col gap-4">
              <Input label="Kapan berdiri?" placeholder="mis. 2012 atau 14 Maret 2012" hint="Tulis persis seperti yang ingin tampil. Kosongkan bila belum pasti." value={founded} onChange={(e) => setFounded(e.target.value)} />
              <Textarea label="Sejarah singkat (opsional)" rows={7} hint="Pisahkan paragraf dengan satu baris kosong." value={history} onChange={(e) => setHistory(e.target.value)} />
            </div>
          </Step>

          <Step n={3} title="Kegiatan rutin">
            <p className="mb-4 text-sm text-ink-500">Apa yang biasa dilakukan UK3. Urutan di sini sama dengan urutan di website.</p>
            <ul className="flex flex-col">
              {activities.map((a, i) => (
                <li key={i} className="flex items-start gap-3 border-b border-paper-300 py-4 first:pt-0">
                  <span className="mt-2.5 w-6 shrink-0 text-xs font-bold text-ink-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input aria-label={`Nama kegiatan ${i + 1}`} placeholder="Nama kegiatan, mis. Persekutuan Doa" value={a.title} onChange={(e) => setAct(i, { title: e.target.value })} />
                    <Input aria-label={`Penjelasan kegiatan ${i + 1}`} placeholder="Penjelasan singkat: kapan dan di mana" value={a.description} onChange={(e) => setAct(i, { description: e.target.value })} />
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Naikkan kegiatan ${i + 1}`} className="p-1.5 text-ink-500 hover:text-brand-700 disabled:opacity-25"><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === activities.length - 1} aria-label={`Turunkan kegiatan ${i + 1}`} className="p-1.5 text-ink-500 hover:text-brand-700 disabled:opacity-25"><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => setActivities((l) => (l.length > 1 ? l.filter((_, k) => k !== i) : [BLANK]))} aria-label={`Hapus kegiatan ${i + 1}`} className="p-1.5 text-ink-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button variant="secondary" icon={Plus} disabled={activities.length >= MAX_ACTIVITIES} onClick={() => setActivities((l) => [...l, BLANK])}>Tambah kegiatan</Button>
            </div>
          </Step>
        </div>

        <aside aria-label="Pratinjau" className="lg:sticky lg:top-6 lg:self-start">
          <div className="kicker mb-3">Pratinjau</div>
          <div className="border border-ink-900 bg-paper-50 p-5">
            <p className="display text-xl leading-snug font-normal">{about.trim() || DEFAULT_ABOUT}</p>
            <dl className="mt-5 border-t border-ink-900 text-xs">
              {[['Persekutuan', 'Doa Revive'], ['Kampus', 'Universitas Trunodjoyo Madura'], ...(founded.trim() ? [['Berdiri', founded.trim()]] : []), ['Periode', currentPeriod()]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2 border-b border-paper-300 py-2">
                  <dt className="font-bold tracking-wider text-brand-600 uppercase">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {cleaned.length > 0 && (
              <ul className="mt-4 text-xs">
                {cleaned.map((a, i) => (
                  <li key={i} className="border-b border-paper-300 py-2">
                    <div className="display text-base">{a.title}</div>
                    {a.description && <div className="text-ink-500">{a.description}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">Visi dan misi tidak diubah di sini. Sosmed diatur di menu <b>Sosmed &amp; Tautan</b>.</p>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-900 bg-paper-50/95 lg:left-64">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <span className={`text-sm ${dirty ? 'font-semibold text-brand-700' : 'text-ink-500'}`} role="status">{dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan sudah tersimpan'}</span>
            <div className="flex gap-2">
              {dirty && <Button variant="secondary" onClick={reset} disabled={saving}>Batalkan</Button>}
              <Button type="submit" loading={saving} disabled={!dirty}>Simpan</Button>
            </div>
          </div>
        </div>
      </form>
    </AdminPage>
  )
}
