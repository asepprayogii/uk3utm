import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Images, Pencil, Trash2, X } from 'lucide-react'
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
  const fileRef = useRef(null)

  // Foto yang sedang disiapkan: tiap foto wajib diberi judul sebelum diunggah.
  const [staged, setStaged] = useState(null) // [{ key, prepared, title }]
  const [preparing, setPreparing] = useState(false)
  const [bulk, setBulk] = useState('')
  const [progress, setProgress] = useState(null)
  const [showErrors, setShowErrors] = useState(false)

  const [editing, setEditing] = useState(null)
  const [caption, setCaption] = useState('')

  const refresh = useCallback(async () => {
    try { setLocal(await fetchPhotos()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  async function pick(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setPreparing(true)
    const items = []
    for (const [i, f] of files.entries()) {
      try { items.push({ key: `${Date.now()}-${i}`, prepared: await prepareImage(f, { maxSize: 1800 }), title: '' }) } catch (err) { toast.error(`${f.name}: ${err.message}`) }
    }
    setPreparing(false)
    if (items.length === 0) return
    setBulk('')
    setShowErrors(false)
    setStaged(items)
  }

  const setTitle = (key, title) => setStaged((list) => list.map((x) => (x.key === key ? { ...x, title } : x)))
  const dropStaged = (key) => setStaged((list) => { const next = list.filter((x) => x.key !== key); return next.length ? next : null })
  const applyBulk = () => setStaged((list) => list.map((x) => (bulk.trim() ? { ...x, title: bulk.trim() } : x)))

  async function uploadAll() {
    setShowErrors(true)
    if (staged.some((x) => !x.title.trim())) return
    let albumId
    try { albumId = await ensureGalleryAlbum() } catch (err) { toast.error(`Galeri belum bisa disiapkan: ${err.message}`); return }
    const stamp = orderStamp()
    let ok = 0
    const failed = []
    for (const [i, x] of staged.entries()) {
      setProgress(`Mengunggah ${i + 1} dari ${staged.length}…`)
      try {
        const url = await uploadPrepared(x.prepared, 'gallery')
        await unwrap(supabase.from('album_photos').insert({ album_id: albumId, photo_url: url, caption: x.title.trim(), order_index: stamp + i }))
        ok++
      } catch (err) {
        toast.error(`“${x.title}”: ${err.message}`)
        failed.push(x)
      }
    }
    setProgress(null)
    if (ok > 0) { toast.success(`${ok} foto ditambahkan ke galeri.`); await refresh() }
    setStaged(failed.length ? failed : null) // yang gagal tetap tampil agar bisa dicoba lagi
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
    if (!(await confirm({ title: 'Hapus foto ini?', message: p.caption ? `“${p.caption}” akan hilang dari galeri.` : 'Foto akan hilang dari galeri.', confirmLabel: 'Ya, hapus' }))) return
    try {
      await unwrap(supabase.from('album_photos').delete().eq('id', p.id))
      removeByUrl(p.photo_url)
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  const missing = staged?.filter((x) => !x.title.trim()).length ?? 0

  return (
    <AdminPage
      title="Galeri"
      description="Foto kegiatan untuk halaman Galeri. Pilih banyak foto sekaligus lalu beri judul tiap foto. Yang terbaru tampil paling atas."
      action={<Button icon={ImagePlus} loading={preparing} onClick={() => fileRef.current?.click()}>Tambah Foto</Button>}
    >
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={pick} />
      {loading && <Loading />}
      {error && <ErrorState message="Galeri gagal dimuat." onRetry={retry} />}
      {!loading && !error && photos.length === 0 && (
        <Card><EmptyState icon={Images} title="Galeri masih kosong" action={<Button icon={ImagePlus} onClick={() => fileRef.current?.click()}>Pilih foto</Button>}>Anda bisa memilih banyak foto sekaligus, lalu memberi judul masing-masing.</EmptyState></Card>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-paper-300 bg-white">
            <div className="relative aspect-[4/3] bg-paper-200">
              <img src={p.photo_url} alt={p.caption || ''} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-1 p-2 pl-3">
              <div className={`min-w-0 flex-1 truncate text-sm ${p.caption ? 'font-semibold text-ink-900' : 'text-ink-400 italic'}`}>{p.caption || 'Belum ada judul'}</div>
              <button type="button" onClick={() => { setEditing(p); setCaption(p.caption ?? '') }} aria-label="Ubah judul" title="Ubah judul" className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-50 hover:text-brand-700"><Pencil size={15} /></button>
              <button type="button" onClick={() => remove(p)} aria-label="Hapus foto" title="Hapus foto" className="rounded-lg p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!staged} onClose={() => !progress && setStaged(null)} title={`Beri judul ${staged?.length ?? 0} foto`} description="Judul tampil di galeri dan saat foto dibuka." size="lg"
        footer={<><Button variant="secondary" onClick={() => setStaged(null)} disabled={!!progress}>Batal</Button><Button onClick={uploadAll} loading={!!progress}>{progress ?? `Unggah ${staged?.length ?? 0} foto`}</Button></>}>
        {staged && (
          <div className="flex flex-col gap-4">
            {staged.length > 1 && (
              <div className="flex items-end gap-2 rounded-xl bg-paper-100 p-3">
                <Input wrapperClassName="flex-1" label="Judul yang sama untuk semua (opsional)" placeholder="mis. Natal Bersama 2026" value={bulk} onChange={(e) => setBulk(e.target.value)} />
                <Button variant="secondary" onClick={applyBulk} disabled={!bulk.trim()}>Terapkan</Button>
              </div>
            )}
            <ul className="flex flex-col gap-3">
              {staged.map((x, i) => (
                <li key={x.key} className="flex items-start gap-3">
                  <img src={x.prepared.preview} alt="" className="aspect-[4/3] w-28 shrink-0 rounded-lg bg-paper-200 object-cover" />
                  <Input wrapperClassName="flex-1" aria-label={`Judul foto ${i + 1}`} placeholder={`Judul foto ${i + 1}`} value={x.title} onChange={(e) => setTitle(x.key, e.target.value)}
                    error={showErrors && !x.title.trim() ? 'Judul wajib diisi.' : undefined} />
                  <button type="button" onClick={() => dropStaged(x.key)} aria-label={`Batalkan foto ${i + 1}`} className="mt-1.5 rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><X size={16} /></button>
                </li>
              ))}
            </ul>
            {showErrors && missing > 0 && <p role="alert" className="text-sm font-semibold text-red-700">{missing} foto belum diberi judul.</p>}
          </div>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Judul Foto" size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Batal</Button><Button type="submit" form="caption-form">Simpan</Button></>}>
        <form id="caption-form" onSubmit={saveCaption}>
          <Input label="Judul" required placeholder="mis. Natal bersama 2025" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </form>
      </Modal>
    </AdminPage>
  )
}
