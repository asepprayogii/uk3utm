import { useCallback, useState } from 'react'
import { Megaphone, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { removeByUrl } from '../../lib/storage'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useImageField } from '../../hooks/useImageField'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input, Textarea, Toggle } from '../../components/ui/Field'
import ImageUpload from '../../components/ui/ImageUpload'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const BLANK = { title: '', content: '', pinned: false }
const fetchAll = () =>
  unwrap(supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })).then((r) => r ?? [])

export default function ManageAnnouncements() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAll, EMPTY)
  const [local, setLocal] = useState(null)
  const list = local ?? data
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const image = useImageField(null)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAll()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  function open(item = null) {
    setForm(item ? { title: item.title, content: item.content, pinned: !!item.pinned } : BLANK)
    image.reset(item?.image_url ?? null)
    setModal({ editing: item })
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { url, changed, oldUrl } = await image.commit('announcements')
      const row = { title: form.title.trim(), content: form.content.trim(), pinned: form.pinned, image_url: url }
      if (modal.editing) await unwrap(supabase.from('announcements').update(row).eq('id', modal.editing.id))
      else await unwrap(supabase.from('announcements').insert(row))
      if (changed && oldUrl) removeByUrl(oldUrl)
      toast.success(modal.editing ? 'Pengumuman diperbarui.' : 'Pengumuman diterbitkan.')
      setModal(null)
      await refresh()
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function togglePin(a) {
    try {
      await unwrap(supabase.from('announcements').update({ pinned: !a.pinned }).eq('id', a.id))
      await refresh()
    } catch (err) { toast.error(`Gagal: ${err.message}`) }
  }

  async function remove(a) {
    if (!(await confirm({ title: 'Hapus pengumuman?', message: `“${a.title}” akan hilang dari website.`, confirmLabel: 'Ya, hapus' }))) return
    try {
      await unwrap(supabase.from('announcements').delete().eq('id', a.id))
      if (a.image_url) removeByUrl(a.image_url)
      toast.success('Pengumuman dihapus.')
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  return (
    <AdminPage title="Pengumuman" description="Info dan kegiatan yang tampil di beranda dan halaman Pengumuman. Yang disematkan selalu di atas." action={<Button icon={Plus} onClick={() => open()}>Buat Pengumuman</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Pengumuman gagal dimuat." onRetry={retry} />}
      {!loading && !error && list.length === 0 && (
        <Card><EmptyState icon={Megaphone} title="Belum ada pengumuman" action={<Button icon={Plus} onClick={() => open()}>Buat pengumuman pertama</Button>}>Tulis info kegiatan agar jemaat kampus tahu.</EmptyState></Card>
      )}
      <div className="flex flex-col gap-3">
        {list.map((a) => (
          <Card key={a.id} className="flex gap-4 p-4">
            {a.image_url && <img src={a.image_url} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-ink-900">{a.title}</h3>
                {a.pinned && <Badge tone="gold" icon={Pin}>Disematkan</Badge>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-500">{a.content}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs text-ink-400">{formatDate(a.created_at)}</span>
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(a)}>Ubah</Button>
                <Button size="sm" variant="ghost" icon={a.pinned ? PinOff : Pin} onClick={() => togglePin(a)}>{a.pinned ? 'Lepas sematan' : 'Sematkan'}</Button>
                <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => remove(a)}>Hapus</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => !saving && setModal(null)} title={modal?.editing ? 'Ubah Pengumuman' : 'Pengumuman Baru'}
        footer={<><Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>Batal</Button><Button type="submit" form="announcement-form" loading={saving}>{modal?.editing ? 'Simpan Perubahan' : 'Terbitkan'}</Button></>}>
        <form id="announcement-form" onSubmit={save} className="flex flex-col gap-4">
          <Input label="Judul" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Isi pengumuman" required rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <ImageUpload field={image} label="Gambar (opsional)" />
          <Toggle label="Sematkan di atas" hint="Pengumuman penting tampil paling atas." checked={form.pinned} onChange={(v) => setForm({ ...form, pinned: v })} />
        </form>
      </Modal>
    </AdminPage>
  )
}
