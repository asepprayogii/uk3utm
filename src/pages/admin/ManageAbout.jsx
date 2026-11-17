import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { friendlyError } from '../../lib/errors'
import { DEFAULT_ABOUT, fetchContent, parseActivities, saveContent } from '../../lib/siteContent'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Button from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Field'
import { ErrorState, Loading } from '../../components/States'

const EMPTY = {}

export default function ManageAbout() {
  const { data, loading, error, retry } = useAsyncData(fetchContent, EMPTY)
  if (loading) return <AdminPage title="Tentang UK3"><Loading /></AdminPage>
  if (error) return <AdminPage title="Tentang UK3"><ErrorState message="Data gagal dimuat." onRetry={retry} /></AdminPage>
  return <AboutForm initial={data} />
}

// Dipisah agar formulir diisi sekali dari data yang sudah termuat (tanpa efek untuk menyalin state).
function AboutForm({ initial }) {
  const { toast } = useUI()
  const [about, setAbout] = useState(initial.about ?? DEFAULT_ABOUT)
  const [founded, setFounded] = useState(initial.founded ?? '')
  const [history, setHistory] = useState(initial.history ?? '')
  const [activities, setActivities] = useState(() => {
    const list = parseActivities(initial.activities)
    return list.length ? list : [{ title: '', description: '' }]
  })
  const [saving, setSaving] = useState(false)

  const setAct = (i, patch) => setActivities((list) => list.map((a, k) => (k === i ? { ...a, ...patch } : a)))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const cleaned = activities.map((a) => ({ title: a.title.trim(), description: a.description.trim() })).filter((a) => a.title)
      await saveContent('about', about.trim())
      await saveContent('founded', founded.trim())
      await saveContent('history', history.trim())
      await saveContent('activities', JSON.stringify(cleaned))
      setActivities(cleaned.length ? cleaned : [{ title: '', description: '' }])
      toast.success('Halaman Tentang disimpan.')
    } catch (err) {
      toast.error(friendlyError(err, 'menyimpan'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPage
      title="Tentang UK3"
      description="Isi halaman Tentang. Bagian yang dikosongkan tidak ditampilkan. Visi, misi, dan sosmed tampil otomatis."
      action={<Button type="submit" form="about-form" loading={saving}>Simpan</Button>}
    >
      <form id="about-form" onSubmit={save} className="flex max-w-3xl flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5">
          <Textarea label="Apa itu UK3?" rows={3} hint="Juga tampil di beranda." value={about} onChange={(e) => setAbout(e.target.value)} />
          <Input label="Kapan berdiri?" placeholder="mis. 2012, atau 14 Maret 2012" hint="Tulis persis seperti yang ingin ditampilkan. Kosongkan bila belum pasti." value={founded} onChange={(e) => setFounded(e.target.value)} />
          <Textarea label="Sejarah singkat (opsional)" rows={6} hint="Pisahkan paragraf dengan satu baris kosong." value={history} onChange={(e) => setHistory(e.target.value)} />
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold text-brand-900">Kegiatan rutin</h2>
          <p className="mt-1 mb-4 text-sm text-ink-500">Apa saja yang biasa dilakukan UK3. Tiap kegiatan punya nama dan penjelasan singkat.</p>
          <ul className="flex flex-col gap-4">
            {activities.map((a, i) => (
              <li key={i} className="flex items-start gap-2 border-t border-paper-300 pt-4 first:border-t-0 first:pt-0">
                <div className="flex flex-1 flex-col gap-2">
                  <Input aria-label={`Nama kegiatan ${i + 1}`} placeholder="Nama kegiatan, mis. Persekutuan Doa" value={a.title} onChange={(e) => setAct(i, { title: e.target.value })} />
                  <Input aria-label={`Penjelasan kegiatan ${i + 1}`} placeholder="Penjelasan singkat (kapan dan di mana)" value={a.description} onChange={(e) => setAct(i, { description: e.target.value })} />
                </div>
                <button type="button" onClick={() => setActivities((l) => (l.length > 1 ? l.filter((_, k) => k !== i) : [{ title: '', description: '' }]))} aria-label={`Hapus kegiatan ${i + 1}`} className="mt-1.5 rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button variant="secondary" icon={Plus} onClick={() => setActivities((l) => [...l, { title: '', description: '' }])}>Tambah kegiatan</Button>
          </div>
        </Card>
      </form>
    </AdminPage>
  )
}
