import { useCallback, useRef, useState } from 'react'
import { FileSpreadsheet, GraduationCap, Search, Trash2, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchAll = () => unwrap(supabase.from('students').select('*').order('name')).then((r) => r ?? [])

function normalizeRows(rows) {
  return rows
    .map((row) => {
      const lower = {}
      Object.keys(row).forEach((k) => { lower[k.toLowerCase().trim()] = row[k] })
      return {
        name: (lower['nama'] ?? lower['name'] ?? '').toString().trim(),
        prodi: (lower['prodi'] ?? lower['program studi'] ?? '').toString().trim(),
        kakak_bimbing: (lower['kakak bimbing'] ?? lower['kakak_bimbing'] ?? lower['mentor'] ?? '').toString().trim(),
      }
    })
    .filter((r) => r.name)
}

export default function ManageStudents() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAll, EMPTY)
  const [local, setLocal] = useState(null)
  const list = local ?? data
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAll()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  async function importFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const XLSX = await import('xlsx') // dimuat hanya saat dibutuhkan
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const rows = normalizeRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]))
      if (rows.length === 0) {
        setResult({ ok: false, text: 'Tidak ada data valid. Pastikan ada kolom NAMA di baris pertama.' })
        return
      }
      // Hapus nama ganda di file; upsert per 100 baris agar cepat.
      const unique = [...new Map(rows.map((r) => [r.name.toLowerCase(), r])).values()]
      let saved = 0
      let failed = 0
      for (let i = 0; i < unique.length; i += 100) {
        const chunk = unique.slice(i, i + 100)
        const { error: err } = await supabase.from('students').upsert(chunk, { onConflict: 'name' })
        if (err) failed += chunk.length
        else saved += chunk.length
      }
      setResult({ ok: failed === 0, text: `${saved} mahasiswa tersimpan${failed ? `, ${failed} gagal` : ''}${rows.length !== unique.length ? `, ${rows.length - unique.length} nama ganda digabung` : ''}.` })
      await refresh()
    } catch (err) {
      setResult({ ok: false, text: `Gagal membaca file: ${err.message}` })
    } finally {
      setImporting(false)
    }
  }

  async function remove(s) {
    if (!(await confirm({ title: `Hapus ${s.name}?`, message: 'Data mahasiswa ini akan dihapus.', confirmLabel: 'Ya, hapus' }))) return
    try { await unwrap(supabase.from('students').delete().eq('id', s.id)); await refresh() } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  async function removeAll() {
    if (!(await confirm({ title: 'Hapus SEMUA mahasiswa?', message: `${list.length} data akan dihapus permanen. Riwayat absensi tidak ikut terhapus.`, confirmLabel: 'Ya, hapus semua' }))) return
    try {
      await unwrap(supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000'))
      toast.success('Semua data mahasiswa dihapus.')
      await refresh()
    } catch (err) { toast.error(`Gagal menghapus: ${err.message}`) }
  }

  const q = search.trim().toLowerCase()
  const filtered = list.filter((s) => !q || `${s.name} ${s.nim ?? ''} ${s.prodi ?? ''} ${s.kakak_bimbing ?? ''}`.toLowerCase().includes(q))

  return (
    <AdminPage
      title="Data Mahasiswa"
      description="Daftar mahasiswa binaan yang muncul sebagai pilihan nama saat absensi."
      action={
        <div className="flex gap-2">
          {list.length > 0 && <Button variant="dangerSoft" icon={Trash2} onClick={removeAll}>Hapus semua</Button>}
          <Button icon={Upload} loading={importing} onClick={() => fileRef.current?.click()}>Impor Excel</Button>
        </div>
      }
    >
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importFile} />

      <Card className="mb-6 flex gap-3 bg-brand-50/50 p-4 text-sm text-ink-700">
        <FileSpreadsheet size={20} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
        <div>
          <div className="font-semibold text-ink-900">Cara impor</div>
          Siapkan file Excel dengan kolom <b>NAMA</b>, <b>PRODI</b>, dan <b>KAKAK BIMBING</b> (baris pertama sebagai judul). Nama yang sudah ada akan diperbarui, bukan digandakan.
        </div>
      </Card>

      {result && (
        <div role="status" className={`mb-6 rounded-xl border px-4 py-3 text-sm ${result.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{result.text}</div>
      )}

      {loading && <Loading />}
      {error && <ErrorState message="Data gagal dimuat." onRetry={retry} />}
      {!loading && !error && list.length === 0 && <Card><EmptyState icon={GraduationCap} title="Belum ada data mahasiswa">Impor dari Excel untuk memulai.</EmptyState></Card>}

      {list.length > 0 && (
        <>
          <Input wrapperClassName="mb-4" icon={Search} aria-label="Cari mahasiswa" placeholder={`Cari di ${list.length} mahasiswa…`} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Card className="overflow-hidden">
            <ul className="divide-y divide-paper-200">
              {filtered.slice(0, 300).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink-900">{s.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {s.prodi && <Badge tone="gray">{s.prodi}</Badge>}
                      {s.kakak_bimbing && <Badge tone="brand">KK: {s.kakak_bimbing}</Badge>}
                    </div>
                  </div>
                  <button type="button" aria-label={`Hapus ${s.name}`} onClick={() => remove(s)} className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                </li>
              ))}
            </ul>
            {filtered.length > 300 && <div className="border-t border-paper-200 px-4 py-3 text-center text-xs text-ink-400">Menampilkan 300 dari {filtered.length}. Gunakan pencarian untuk mempersempit.</div>}
            {filtered.length === 0 && <EmptyState title="Tidak ada hasil" />}
          </Card>
        </>
      )}
    </AdminPage>
  )
}
