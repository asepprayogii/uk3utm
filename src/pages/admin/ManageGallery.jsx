import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Images, Loader2, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { prepareImage } from '../../lib/image'
import { removeByUrl, uploadPrepared } from '../../lib/storage'
import { ensureGalleryAlbum, fetchPhotos, orderStamp } from '../../lib/gallery'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const load = () => fetchPhotos()

export default function ManageGallery() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(load, EMPTY)
  const [local, setLocal] = useState(null)
  const photos = local ?? data
  const [busy, setBusy] = useState(null)
  const [editing, setEditing] = useState(null)
  const [caption, setCaption] = useState('')
  const fileRef = useRef(null)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchPhotos()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  async function upload(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    let albumId
    try { albumId = await ensureGalleryAlbum() } catch (err) { toast.error(`Galeri belum bisa disiapkan: ${err.message}`); return }
    const stamp = orderStamp()
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      setBusy(`Mengunggah ${i + 1} dari ${files.length}…`)
      try {
        const prepared = await prepareImage(files[i], { maxSize: 1800 })
        const url = await uploadPrepared(prepared, 'gallery')
        await unwrap(supabase.from('album_photos').insert({ album_id: albumId, photo_url: url, caption: '', order_index: stamp + i }))
        ok++
      } catch (err) {
        toast.error(`${files[i].name}: ${err.message}`)
      }
    }
    setBusy(null)
    if (ok > 0) { toast.success(`${ok} foto ditambahkan ke galeri.`); await refresh() }
  }

  async function saveCaption(e) {
    e.preventDefault()
    try {
      await unwrap(supabase.from('album_photos').update({ caption: caption.trim() }).eq('id', editing.id))
      setEditing(null)
      await refresh()
    } catch (err) { toast.error(`Gagal menyimpan: ${err.message}`) }
  }

  async function remove(p) {
    if (!(await confirm({ title: 'Hapus foto ini?', message: 'Foto akan hilang dari galeri.', confirmLabel: 'Ya, hapus' }))) return
    try {
      await unwrap(supabase.from('album_photos').delete().eq('id', p.id))
      removeByUrl(p.photo_url)
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  return (
    <AdminPage
      title="Galeri"
      description="Foto kegiatan yang tampil di halaman Galeri. Pilih banyak foto sekaligus; foto diperkecil otomatis dan yang terbaru tampil paling atas."
      action={<Button icon={busy ? Loader2 : ImagePlus} loading={!!busy} onClick={() => fileRef.current?.click()}>{busy ?? 'Tambah Foto'}</Button>}
    >
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={upload} />
      {loading && <Loading />}
      {error && <ErrorState message="Galeri gagal dimuat." onRetry={retry} />}
      {!loading && !error && photos.length === 0 && (
        <Card><EmptyState icon={Images} title="Galeri masih kosong" action={<Button icon={ImagePlus} onClick={() => fileRef.current?.click()}>Pilih foto</Button>}>Anda bisa memilih banyak foto sekaligus.</EmptyState></Card>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-paper-200">
            <img src={p.photo_url} alt={p.caption || ''} loading="lazy" className="h-full w-full object-cover" />
            {p.caption && <div className="absolute inset-x-0 top-0 truncate bg-gradient-to-b from-black/60 to-transparent p-2 text-xs text-white">{p.caption}</div>}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button type="button" onClick={() => { setEditing(p); setCaption(p.caption ?? '') }} aria-label="Ubah keterangan" title="Ubah keterangan" className="rounded-lg bg-white/90 p-2 text-brand-700 hover:bg-white"><Pencil size={15} /></button>
              <button type="button" onClick={() => remove(p)} aria-label="Hapus foto" title="Hapus foto" className="rounded-lg bg-white/90 p-2 text-red-600 hover:bg-white"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Keterangan Foto" size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Batal</Button><Button type="submit" form="caption-form">Simpan</Button></>}>
        <form id="caption-form" onSubmit={saveCaption}>
          <Input label="Keterangan (opsional)" placeholder="mis. Natal bersama 2025" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </form>
      </Modal>
    </AdminPage>
  )
}
