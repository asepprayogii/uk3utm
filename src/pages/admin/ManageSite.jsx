import { useCallback, useState } from 'react'
import { ExternalLink, GripVertical, Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Button from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Field'
import { ErrorState, Loading } from '../../components/States'

const INITIAL = { content: { about: '', vision: '', mission: '' }, links: [] }

async function fetchSite() {
  const [rows, links] = await Promise.all([
    unwrap(supabase.from('site_content').select('*')),
    unwrap(supabase.from('links').select('*').order('order_index')),
  ])
  const map = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))
  return { content: { about: map.about ?? '', vision: map.vision ?? '', mission: map.mission ?? '' }, links: links ?? [] }
}

// Tidak diketahui apakah `key` bersifat unik di database, jadi pakai ubah-lalu-tambah, bukan upsert.
async function saveKey(key, value) {
  const existing = await unwrap(supabase.from('site_content').select('key').eq('key', key).limit(1))
  if (existing?.length) await unwrap(supabase.from('site_content').update({ value }).eq('key', key))
  else await unwrap(supabase.from('site_content').insert({ key, value }))
}

export default function ManageSite() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchSite, INITIAL)
  const [draft, setDraft] = useState(null)
  const content = draft ?? data.content
  const [savingContent, setSavingContent] = useState(false)
  const [local, setLocal] = useState(null)
  const links = local ?? data.links
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [addingLink, setAddingLink] = useState(false)

  const reloadLinks = useCallback(async () => {
    try { setLocal(await unwrap(supabase.from('links').select('*').order('order_index'))) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  async function saveContent(e) {
    e.preventDefault()
    setSavingContent(true)
    try {
      for (const k of ['about', 'vision', 'mission']) await saveKey(k, content[k].trim())
      toast.success('Tampilan beranda disimpan.')
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err.message}. Pastikan akun Anda diizinkan mengubah konten situs.`)
    } finally { setSavingContent(false) }
  }

  async function addLink(e) {
    e.preventDefault()
    let url = newLink.url.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    setAddingLink(true)
    try {
      await unwrap(supabase.from('links').insert({ label: newLink.label.trim(), url, order_index: links.length }))
      setNewLink({ label: '', url: '' })
      toast.success('Tautan ditambahkan.')
      await reloadLinks()
    } catch (err) { toast.error(`Gagal menambah tautan: ${err.message}`) } finally { setAddingLink(false) }
  }

  async function removeLink(l) {
    if (!(await confirm({ title: `Hapus tautan “${l.label}”?`, message: 'Tautan akan hilang dari beranda.', confirmLabel: 'Ya, hapus' }))) return
    try { await unwrap(supabase.from('links').delete().eq('id', l.id)); await reloadLinks() } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  const set = (k) => (e) => setDraft({ ...content, [k]: e.target.value })
  const missionCount = content.mission.split('\n').filter((m) => m.trim()).length

  return (
    <AdminPage title="Beranda & Tautan" description="Teks perkenalan, visi, misi, dan tautan media sosial yang tampil di halaman beranda." action={<Button variant="secondary" icon={ExternalLink} href="/" target="_blank" rel="noopener noreferrer">Lihat beranda</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Pengaturan gagal dimuat." onRetry={retry} />}
      {!loading && !error && (
        <div className="flex flex-col gap-8">
          <form onSubmit={saveContent}>
            <Card className="flex flex-col gap-5 p-6">
              <h2 className="text-lg font-bold text-ink-900">Tentang, Visi & Misi</h2>
              <Textarea label="Tentang UK3" rows={3} hint="Kalimat perkenalan di bagian paling atas beranda." value={content.about} onChange={set('about')} />
              <Textarea label="Visi" rows={3} value={content.vision} onChange={set('vision')} />
              <Textarea label="Misi" rows={6} hint={`Satu poin per baris (${missionCount} poin). Tanda • atau - di awal akan dirapikan otomatis.`} value={content.mission} onChange={set('mission')} />
              <div><Button type="submit" icon={Save} loading={savingContent}>Simpan</Button></div>
            </Card>
          </form>

          <Card className="p-6">
            <h2 className="mb-1 text-lg font-bold text-ink-900">Tautan</h2>
            <p className="mb-4 text-sm text-ink-500">Instagram, YouTube, grup WhatsApp, atau tautan lain yang ingin ditonjolkan.</p>
            <ul className="mb-5 flex flex-col gap-2">
              {links.length === 0 && <li className="rounded-xl border border-dashed border-paper-300 py-6 text-center text-sm text-ink-400">Belum ada tautan.</li>}
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-paper-300 px-3 py-2.5">
                  <GripVertical size={16} className="text-ink-300" aria-hidden="true" />
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-ink-900">{l.label}</div><div className="truncate text-xs text-ink-400">{l.url}</div></div>
                  <button type="button" onClick={() => removeLink(l)} aria-label={`Hapus ${l.label}`} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={addLink} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
              <Input label="Nama tautan" required placeholder="Instagram UK3" value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} />
              <Input label="Alamat (URL)" required placeholder="instagram.com/uk3utm" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
              <Button type="submit" icon={Plus} loading={addingLink}>Tambah</Button>
            </form>
          </Card>
        </div>
      )}
    </AdminPage>
  )
}
