import { useCallback, useState } from 'react'
import { BookOpen, Dumbbell, EyeOff, HandHeart, Heart, MessageCircle, Megaphone, Music, Package, Palette, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { removeByUrl } from '../../lib/storage'
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

const ICONS = [
  { key: 'HandHeart', label: 'Pelayanan', Icon: HandHeart },
  { key: 'BookOpen', label: 'Doa/Rohani', Icon: BookOpen },
  { key: 'MessageCircle', label: 'Konseling', Icon: MessageCircle },
  { key: 'Heart', label: 'Kasih/Donasi', Icon: Heart },
  { key: 'Package', label: 'Inventaris', Icon: Package },
  { key: 'Megaphone', label: 'Pengumuman', Icon: Megaphone },
  { key: 'Music', label: 'Musik', Icon: Music },
  { key: 'Dumbbell', label: 'Olahraga', Icon: Dumbbell },
  { key: 'Palette', label: 'Kreatif', Icon: Palette },
  { key: 'Users', label: 'Komunitas', Icon: Users },
]
const iconOf = (key) => (ICONS.find((i) => i.key === key) ?? ICONS[0]).Icon

const EMPTY = []
const blank = (n = 0) => ({ title: '', description: '', icon: 'HandHeart', cp_name: '', cp_wa: '', cp_name2: '', cp_wa2: '', form_url: '', order_index: n, is_active: true })
const fetchAll = () => unwrap(supabase.from('services').select('*').order('order_index')).then((r) => r ?? [])

export default function ManageServices() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAll, EMPTY)
  const [local, setLocal] = useState(null)
  const list = local ?? data
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(blank())
  const [saving, setSaving] = useState(false)
  const image = useImageField(null)
  const qris = useImageField(null)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAll()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  function open(item = null) {
    setForm(item ? {
      title: item.title, description: item.description ?? '', icon: item.icon ?? 'HandHeart', cp_name: item.cp_name ?? '', cp_wa: item.cp_wa ?? '',
      cp_name2: item.cp_name2 ?? '', cp_wa2: item.cp_wa2 ?? '', form_url: item.form_url ?? '', order_index: item.order_index ?? 0, is_active: item.is_active !== false,
    } : blank(list.length))
    image.reset(item?.image_url ?? null)
    qris.reset(item?.qris_url ?? null)
    setModal({ editing: item })
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const img = await image.commit('services/images')
      const q = await qris.commit('services/qris')
      const row = { ...form, title: form.title.trim(), order_index: Number(form.order_index) || 0, image_url: img.url, qris_url: q.url }
      if (modal.editing) await unwrap(supabase.from('services').update(row).eq('id', modal.editing.id))
      else await unwrap(supabase.from('services').insert(row))
      if (img.changed && img.oldUrl) removeByUrl(img.oldUrl)
      if (q.changed && q.oldUrl) removeByUrl(q.oldUrl)
      toast.success('Layanan disimpan.')
      setModal(null)
      await refresh()
    } catch (err) { toast.error(`Gagal menyimpan: ${err.message}`) } finally { setSaving(false) }
  }

  async function remove(s) {
    if (!(await confirm({ title: `Hapus layanan “${s.title}”?`, message: 'Layanan ini akan hilang dari website.', confirmLabel: 'Ya, hapus' }))) return
    try {
      await unwrap(supabase.from('services').delete().eq('id', s.id))
      if (s.image_url) removeByUrl(s.image_url)
      if (s.qris_url) removeByUrl(s.qris_url)
      toast.success('Layanan dihapus.')
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  return (
    <AdminPage title="Layanan" description="Layanan yang tampil di halaman Layanan: kontak WhatsApp, formulir, dan QRIS donasi." action={<Button icon={Plus} onClick={() => open()}>Tambah Layanan</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Layanan gagal dimuat." onRetry={retry} />}
      {!loading && !error && list.length === 0 && <Card><EmptyState icon={HandHeart} title="Belum ada layanan" action={<Button icon={Plus} onClick={() => open()}>Tambah layanan</Button>}>Contoh: Konseling, Permohonan Doa, Persembahan.</EmptyState></Card>}

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((s) => {
          const Icon = iconOf(s.icon)
          return (
            <Card key={s.id} className={`flex flex-col gap-3 p-4 ${s.is_active === false ? 'opacity-70' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-ink-900">{s.title}</h3>{s.is_active === false && <Badge tone="gray" icon={EyeOff}>Disembunyikan</Badge>}</div>
                  <p className="line-clamp-2 text-sm text-ink-500">{s.description || 'Tanpa deskripsi'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {s.cp_wa && <Badge tone="green">WhatsApp</Badge>}{s.form_url && <Badge tone="brand">Formulir</Badge>}{s.qris_url && <Badge tone="gold">QRIS</Badge>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(s)}>Ubah</Button>
                <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => remove(s)}>Hapus</Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={!!modal} onClose={() => !saving && setModal(null)} title={modal?.editing ? 'Ubah Layanan' : 'Layanan Baru'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>Batal</Button><Button type="submit" form="service-form" loading={saving}>Simpan</Button></>}>
        <form id="service-form" onSubmit={save} className="flex flex-col gap-5">
          <Input label="Nama layanan" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Deskripsi" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <div className="mb-1.5 text-xs font-semibold text-ink-700">Ikon</div>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map(({ key, label, Icon }) => (
                <button key={key} type="button" title={label} aria-label={label} aria-pressed={form.icon === key} onClick={() => setForm({ ...form, icon: key })}
                  className={`flex h-11 items-center justify-center rounded-xl border ${form.icon === key ? 'border-brand-700 bg-brand-50 text-brand-700 ring-1 ring-brand-700' : 'border-paper-300 text-ink-500 hover:bg-paper-50'}`}><Icon size={20} /></button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Kontak 1 — nama" value={form.cp_name} onChange={(e) => setForm({ ...form, cp_name: e.target.value })} />
            <Input label="Kontak 1 — WhatsApp" placeholder="08xxxxxxxxxx" inputMode="tel" value={form.cp_wa} onChange={(e) => setForm({ ...form, cp_wa: e.target.value })} />
            <Input label="Kontak 2 — nama" value={form.cp_name2} onChange={(e) => setForm({ ...form, cp_name2: e.target.value })} />
            <Input label="Kontak 2 — WhatsApp" placeholder="08xxxxxxxxxx" inputMode="tel" value={form.cp_wa2} onChange={(e) => setForm({ ...form, cp_wa2: e.target.value })} />
          </div>
          <Input label="Link formulir (opsional)" type="url" placeholder="https://forms.gle/…" value={form.form_url} onChange={(e) => setForm({ ...form, form_url: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload field={image} label="Gambar (opsional)" />
            <ImageUpload field={qris} label="QRIS / barcode (opsional)" shape="square" lossless hint="Disimpan tanpa kompres lossy agar tetap terbaca." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Urutan tampil" type="number" min="0" hint="Angka kecil tampil lebih dulu." value={form.order_index} onChange={(e) => setForm({ ...form, order_index: e.target.value })} />
            <Toggle label="Tampilkan di website" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
        </form>
      </Modal>
    </AdminPage>
  )
}
