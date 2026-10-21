import { useCallback, useState } from 'react'
import { Plus, Search, Trash2, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const BLANK = { name: '', angkatan_bimbing: '', prodi: '' }
const fetchAll = () => unwrap(supabase.from('mentors').select('*').order('angkatan_bimbing').order('name')).then((r) => r ?? [])

export default function ManageMentors() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAll, EMPTY)
  const [local, setLocal] = useState(null)
  const list = local ?? data
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAll()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await unwrap(supabase.from('mentors').insert({ name: form.name.trim(), angkatan_bimbing: form.angkatan_bimbing.trim(), prodi: form.prodi.trim() }))
      toast.success(`${form.name.trim()} ditambahkan.`)
      setForm(BLANK)
      setOpen(false)
      await refresh()
    } catch (err) { toast.error(`Gagal menyimpan: ${err.message}`) } finally { setSaving(false) }
  }

  async function remove(m) {
    if (!(await confirm({ title: `Hapus ${m.name}?`, message: 'Data kakak bimbing ini akan dihapus.', confirmLabel: 'Ya, hapus' }))) return
    try {
      await unwrap(supabase.from('mentors').delete().eq('id', m.id))
      toast.success('Kakak bimbing dihapus.')
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  const q = search.trim().toLowerCase()
  const filtered = list.filter((m) => !q || `${m.name} ${m.angkatan_bimbing} ${m.prodi ?? ''}`.toLowerCase().includes(q))
  const grouped = filtered.reduce((acc, m) => {
    const key = m.angkatan_bimbing || 'Tanpa angkatan'
    ;(acc[key] ??= []).push(m)
    return acc
  }, {})

  return (
    <AdminPage title="Kakak Bimbing" description="Daftar kakak bimbing per angkatan. Dipakai sebagai pilihan saat mahasiswa absen." action={<Button icon={Plus} onClick={() => setOpen(true)}>Tambah Kakak Bimbing</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Data gagal dimuat." onRetry={retry} />}
      {!loading && !error && list.length === 0 && (
        <Card><EmptyState icon={UserCheck} title="Belum ada kakak bimbing" action={<Button icon={Plus} onClick={() => setOpen(true)}>Tambah sekarang</Button>}>Tambahkan kakak bimbing agar tercatat di sistem.</EmptyState></Card>
      )}
      {list.length > 0 && (
        <>
          <Input wrapperClassName="mb-6" icon={Search} placeholder="Cari nama, angkatan, atau prodi…" aria-label="Cari" value={search} onChange={(e) => setSearch(e.target.value)} />
          {filtered.length === 0 && <EmptyState title="Tidak ada hasil">Coba kata kunci lain.</EmptyState>}
          <div className="flex flex-col gap-8">
            {Object.entries(grouped).map(([angkatan, items]) => (
              <section key={angkatan}>
                <h2 className="mb-3 text-sm font-bold tracking-wide text-brand-800 uppercase">Angkatan {angkatan} <span className="font-normal text-ink-400">· {items.length}</span></h2>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {items.map((m) => (
                    <Card key={m.id} className="flex items-center justify-between gap-3 p-3 pl-4">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink-900">{m.name}</div>
                        {m.prodi && <Badge tone="gray">{m.prodi}</Badge>}
                      </div>
                      <button type="button" aria-label={`Hapus ${m.name}`} onClick={() => remove(m)} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Tambah Kakak Bimbing" size="sm"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Batal</Button><Button type="submit" form="mentor-form" loading={saving}>Simpan</Button></>}>
        <form id="mentor-form" onSubmit={save} className="flex flex-col gap-4">
          <Input label="Nama lengkap" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Angkatan bimbing" required placeholder="mis. 2022" value={form.angkatan_bimbing} onChange={(e) => setForm({ ...form, angkatan_bimbing: e.target.value })} />
          <Input label="Program studi" placeholder="mis. Teknik Informatika" value={form.prodi} onChange={(e) => setForm({ ...form, prodi: e.target.value })} />
        </form>
      </Modal>
    </AdminPage>
  )
}
