import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, Check, ImagePlus, Images, Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { prepareImage } from '../../lib/image'
import { removeByUrl, uploadPrepared } from '../../lib/storage'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useImageField } from '../../hooks/useImageField'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Field'
import ImageUpload from '../../components/ui/ImageUpload'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const BLANK = { title: '', description: '', event_date: '' }
const fetchAlbums = () => unwrap(supabase.from('albums').select('*').order('event_date', { ascending: false })).then((r) => r ?? [])

function PhotoManager({ album, onBack, onChanged }) {
  const { toast, confirm } = useUI()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(null)
  const [cover, setCover] = useState(album.cover_url)
  const fetchPhotos = useCallback(
    () => unwrap(supabase.from('album_photos').select('*').eq('album_id', album.id).order('order_index')).then((r) => r ?? []),
    [album.id],
  )
  const { data, loading, error, retry } = useAsyncData(fetchPhotos, EMPTY)
  const [local, setLocal] = useState(null)
  const photos = local ?? data

  const reload = useCallback(async () => { setLocal(await fetchPhotos()) }, [fetchPhotos])

  async function upload(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    let ok = 0
    let first = null
    const start = photos.length
    for (let i = 0; i < files.length; i++) {
      setBusy(`Mengunggah ${i + 1} dari ${files.length}…`)
      try {
        const prepared = await prepareImage(files[i], { maxSize: 1800 })
        const url = await uploadPrepared(prepared, `albums/${album.id}`)
        await unwrap(supabase.from('album_photos').insert({ album_id: album.id, photo_url: url, order_index: start + i }))
        first ??= url
        ok++
      } catch (err) {
        toast.error(`${files[i].name}: ${err.message}`)
      }
    }
    setBusy(null)
    if (ok > 0) {
      toast.success(`${ok} foto ditambahkan.`)
      if (!cover && first) {
        await supabase.from('albums').update({ cover_url: first }).eq('id', album.id)
        setCover(first)
        onChanged()
      }
      await reload()
    }
  }

  async function setAsCover(p) {
    try {
      await unwrap(supabase.from('albums').update({ cover_url: p.photo_url }).eq('id', album.id))
      setCover(p.photo_url)
      onChanged()
      toast.success('Sampul album diganti.')
    } catch (err) { toast.error(`Gagal: ${err.message}`) }
  }

  async function removePhoto(p) {
    if (!(await confirm({ title: 'Hapus foto ini?', message: 'Foto akan dihapus dari album.', confirmLabel: 'Ya, hapus' }))) return
    try {
      await unwrap(supabase.from('album_photos').delete().eq('id', p.id))
      removeByUrl(p.photo_url)
      await reload()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  return (
    <AdminPage
      title={album.title}
      description={album.event_date ? formatDate(album.event_date) : 'Kelola foto di album ini.'}
      action={<div className="flex gap-2"><Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Semua album</Button><Button icon={busy ? Loader2 : ImagePlus} loading={!!busy} onClick={() => fileRef.current?.click()}>{busy ?? 'Tambah Foto'}</Button></div>}
    >
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={upload} />
      {loading && <Loading />}
      {error && <ErrorState message="Foto gagal dimuat." onRetry={retry} />}
      {!loading && !error && photos.length === 0 && <Card><EmptyState icon={Images} title="Album masih kosong" action={<Button icon={ImagePlus} onClick={() => fileRef.current?.click()}>Pilih foto</Button>}>Anda bisa memilih banyak foto sekaligus. Foto diperkecil otomatis agar website tetap cepat.</EmptyState></Card>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-paper-200">
            <img src={p.photo_url} alt="" loading="lazy" className="h-full w-full object-cover" />
            {cover === p.photo_url && <span className="absolute top-2 left-2"><Badge tone="gold" icon={Star}>Sampul</Badge></span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              {cover !== p.photo_url && <button type="button" onClick={() => setAsCover(p)} aria-label="Jadikan sampul" title="Jadikan sampul" className="rounded-lg bg-white/90 p-2 text-brand-700 hover:bg-white"><Check size={15} /></button>}
              <button type="button" onClick={() => removePhoto(p)} aria-label="Hapus foto" title="Hapus foto" className="rounded-lg bg-white/90 p-2 text-red-600 hover:bg-white"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </AdminPage>
  )
}

export default function ManageAlbum() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAlbums, EMPTY)
  const [local, setLocal] = useState(null)
  const albums = local ?? data
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const cover = useImageField(null)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAlbums()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  function open(item = null) {
    setForm(item ? { title: item.title, description: item.description ?? '', event_date: item.event_date ?? '' } : BLANK)
    cover.reset(item?.cover_url ?? null)
    setModal({ editing: item })
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { url, changed, oldUrl } = await cover.commit('albums/covers')
      const row = { title: form.title.trim(), description: form.description.trim(), event_date: form.event_date || null, cover_url: url }
      let created = null
      if (modal.editing) await unwrap(supabase.from('albums').update(row).eq('id', modal.editing.id))
      else created = await unwrap(supabase.from('albums').insert(row).select().single())
      if (changed && oldUrl) removeByUrl(oldUrl)
      toast.success(modal.editing ? 'Album diperbarui.' : 'Album dibuat. Sekarang tambahkan foto.')
      setModal(null)
      await refresh()
      if (created) setSelected(created)
    } catch (err) { toast.error(`Gagal menyimpan: ${err.message}`) } finally { setSaving(false) }
  }

  async function remove(a) {
    if (!(await confirm({ title: `Hapus album “${a.title}”?`, message: 'Semua foto di dalam album ikut terhapus.', confirmLabel: 'Ya, hapus album' }))) return
    try {
      const photos = await unwrap(supabase.from('album_photos').select('photo_url').eq('album_id', a.id))
      await unwrap(supabase.from('album_photos').delete().eq('album_id', a.id))
      await unwrap(supabase.from('albums').delete().eq('id', a.id))
      ;(photos ?? []).forEach((p) => removeByUrl(p.photo_url))
      if (a.cover_url) removeByUrl(a.cover_url)
      toast.success('Album dihapus.')
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  if (selected) return <PhotoManager key={selected.id} album={selected} onBack={() => setSelected(null)} onChanged={refresh} />

  return (
    <AdminPage title="Album" description="Kumpulan foto kegiatan. Buat album, lalu unggah banyak foto sekaligus." action={<Button icon={Plus} onClick={() => open()}>Buat Album</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Album gagal dimuat." onRetry={retry} />}
      {!loading && !error && albums.length === 0 && <Card><EmptyState icon={Images} title="Belum ada album" action={<Button icon={Plus} onClick={() => open()}>Buat album pertama</Button>}>Dokumentasikan kegiatan UK3 di sini.</EmptyState></Card>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <Card key={a.id} className="overflow-hidden">
            <button type="button" onClick={() => setSelected(a)} className="block aspect-video w-full bg-brand-900" aria-label={`Buka album ${a.title}`}>
              {a.cover_url ? <img src={a.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Images className="mx-auto text-white/30" size={36} />}
            </button>
            <div className="p-4">
              <h3 className="truncate font-bold text-ink-900">{a.title}</h3>
              <div className="text-xs text-ink-500">{a.event_date ? formatDate(a.event_date) : 'Tanpa tanggal'}</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => setSelected(a)}>Kelola foto</Button>
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(a)} aria-label="Ubah info album" />
                <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => remove(a)} aria-label="Hapus album" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => !saving && setModal(null)} title={modal?.editing ? 'Ubah Album' : 'Album Baru'}
        footer={<><Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>Batal</Button><Button type="submit" form="album-form" loading={saving}>{modal?.editing ? 'Simpan' : 'Buat & tambah foto'}</Button></>}>
        <form id="album-form" onSubmit={save} className="flex flex-col gap-4">
          <Input label="Nama album" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Tanggal kegiatan" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          <Textarea label="Deskripsi (opsional)" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ImageUpload field={cover} label="Sampul (opsional)" hint="Jika kosong, foto pertama yang diunggah jadi sampul." />
        </form>
      </Modal>
    </AdminPage>
  )
}
