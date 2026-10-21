import { useCallback, useState } from 'react'
import { Archive, ChevronDown, Copy, ExternalLink, Eye, MapPin, Plus, QrCode, RotateCcw, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const INITIAL = { sessions: [], archived: [], locations: [] }
const today = () => new Date().toISOString().split('T')[0]
const generateToken = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
const scanUrl = (token) => `${window.location.origin}/scan/${token}`

async function fetchAll() {
  const [s, a, l] = await Promise.all([
    unwrap(supabase.from('sessions').select('*, locations(name)').eq('archived', false).order('created_at', { ascending: false })),
    unwrap(supabase.from('sessions').select('*, locations(name)').eq('archived', true).order('archived_at', { ascending: false })),
    unwrap(supabase.from('locations').select('*').order('name')),
  ])
  return { sessions: s ?? [], archived: a ?? [], locations: l ?? [] }
}

function SessionCard({ s, archived, onQr, onToggle, onArchive, onRestore, onDelete }) {
  return (
    <Card className={`p-4 sm:p-5 ${archived ? 'opacity-80' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink-900">{s.title}</h3>
            <Badge tone={s.type === 'event' ? 'gold' : 'brand'}>{s.type === 'event' ? 'Event' : 'Persekutuan Doa'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink-500">
            <span>{formatDate(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {s.locations?.name && <span className="inline-flex items-center gap-1"><MapPin size={12} />{s.locations.name}</span>}
            {archived && s.archived_at && <span>Diarsipkan {formatDate(s.archived_at)}</span>}
          </div>
        </div>
        {archived ? <Badge tone="amber">Arsip</Badge> : <Badge tone={s.status === 'active' ? 'green' : 'gray'}>{s.status === 'active' ? '● Absensi dibuka' : '○ Ditutup'}</Badge>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!archived && <Button size="sm" icon={QrCode} onClick={() => onQr(s)}>Tampilkan QR</Button>}
        <Button size="sm" variant="secondary" icon={Eye} to={`/admin/absensi/${s.id}`}>Lihat absensi</Button>
        {!archived && <Button size="sm" variant="secondary" onClick={() => onToggle(s)}>{s.status === 'active' ? 'Tutup absensi' : 'Buka lagi'}</Button>}
        {!archived ? <Button size="sm" variant="ghost" icon={Archive} onClick={() => onArchive(s)}>Arsipkan</Button> : <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => onRestore(s)}>Pulihkan</Button>}
        <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => onDelete(s)} aria-label={`Hapus permanen ${s.title}`} />
      </div>
    </Card>
  )
}

export default function ManageSessions() {
  const { toast, confirm } = useUI()
  const { data, loading, error, retry } = useAsyncData(fetchAll, INITIAL)
  const [local, setLocal] = useState(null)
  const { sessions, archived, locations } = local ?? data
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: today(), location_id: '', type: 'pd' })
  const [saving, setSaving] = useState(false)
  const [qr, setQr] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const refresh = useCallback(async () => {
    try { setLocal(await fetchAll()) } catch (e) { toast.error(`Gagal memuat ulang: ${e.message}`) }
  }, [toast])

  const run = useCallback(async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg); await refresh() } catch (e) { toast.error(`Gagal: ${e.message}`) }
  }, [refresh, toast])

  function openForm() {
    setForm({ title: '', date: today(), location_id: locations[0]?.id ?? '', type: 'pd' })
    setFormOpen(true)
  }

  async function create(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await unwrap(supabase.from('sessions').insert({ ...form, title: form.title.trim(), token: generateToken(), status: 'active', archived: false }).select('*, locations(name)').single())
      setFormOpen(false)
      toast.success('Sesi dibuat. Tampilkan QR ini kepada peserta.')
      await refresh()
      setQr(created)
    } catch (err) { toast.error(`Gagal membuat sesi: ${err.message}`) } finally { setSaving(false) }
  }

  const toggle = (s) => run(() => unwrap(supabase.from('sessions').update({ status: s.status === 'active' ? 'closed' : 'active' }).eq('id', s.id)), s.status === 'active' ? 'Absensi ditutup.' : 'Absensi dibuka kembali.')
  const archive = (s) => run(() => unwrap(supabase.from('sessions').update({ archived: true, archived_at: new Date().toISOString(), status: 'closed' }).eq('id', s.id)), 'Sesi diarsipkan.')
  const restore = (s) => run(() => unwrap(supabase.from('sessions').update({ archived: false, archived_at: null }).eq('id', s.id)), 'Sesi dipulihkan.')
  async function del(s) {
    if (!(await confirm({ title: 'Hapus permanen?', message: `Sesi “${s.title}” dan semua data absensinya akan dihapus. Tidak bisa dibatalkan. Jika hanya ingin menyembunyikan, gunakan Arsipkan.`, confirmLabel: 'Ya, hapus permanen' }))) return
    run(() => unwrap(supabase.from('sessions').delete().eq('id', s.id)), 'Sesi dihapus.')
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(scanUrl(qr.token)); toast.success('Link disalin.') } catch { toast.error('Tidak bisa menyalin otomatis.') }
  }

  const cardProps = { onQr: setQr, onToggle: toggle, onArchive: archive, onRestore: restore, onDelete: del }

  return (
    <AdminPage title="Sesi Absensi" description="Buat sesi untuk setiap Persekutuan Doa atau event, lalu tampilkan QR agar peserta bisa absen dari ponsel." action={<Button icon={Plus} onClick={openForm}>Buat Sesi</Button>}>
      {loading && <Loading />}
      {error && <ErrorState message="Sesi gagal dimuat." onRetry={retry} />}
      {!loading && !error && sessions.length === 0 && <Card><EmptyState icon={QrCode} title="Belum ada sesi" action={<Button icon={Plus} onClick={openForm}>Buat sesi pertama</Button>}>Setiap sesi punya QR unik untuk absensi.</EmptyState></Card>}

      <div className="flex flex-col gap-3">{sessions.map((s) => <SessionCard key={s.id} s={s} archived={false} {...cardProps} />)}</div>

      {archived.length > 0 && (
        <div className="mt-8">
          <button type="button" onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived} className="mb-3 flex w-full items-center justify-between rounded-xl border border-paper-300 bg-white px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-paper-50">
            <span className="flex items-center gap-2"><Archive size={16} /> Arsip ({archived.length})</span>
            <ChevronDown size={16} className={showArchived ? 'rotate-180' : ''} />
          </button>
          {showArchived && <div className="flex flex-col gap-3">{archived.map((s) => <SessionCard key={s.id} s={s} archived {...cardProps} />)}</div>}
        </div>
      )}

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} title="Buat Sesi Baru"
        footer={locations.length > 0 && <><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button type="submit" form="session-form" loading={saving}>Buat & tampilkan QR</Button></>}>
        {locations.length === 0 ? (
          <EmptyState icon={MapPin} title="Tambahkan lokasi dulu" action={<Button to="/admin/lokasi">Ke Lokasi Absensi</Button>}>Absensi memakai lokasi untuk memastikan peserta hadir di tempat. Buat minimal satu lokasi.</EmptyState>
        ) : (
          <form id="session-form" onSubmit={create} className="flex flex-col gap-4">
            <Input label="Nama sesi" required placeholder="mis. PD Revive Minggu 1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Jenis" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="pd">Persekutuan Doa</option><option value="event">Event</option></Select>
              <Input label="Tanggal" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <Select label="Lokasi" required value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </form>
        )}
      </Modal>

      <Modal open={!!qr} onClose={() => setQr(null)} title="QR Absensi" description={qr?.title} size="sm"
        footer={<><Button variant="secondary" icon={Copy} onClick={copyLink}>Salin link</Button><Button variant="secondary" icon={ExternalLink} href={qr ? scanUrl(qr.token) : '#'} target="_blank" rel="noopener noreferrer">Buka</Button></>}>
        {qr && (
          <div className="text-center">
            <div className="inline-block rounded-2xl border border-paper-300 bg-white p-4"><QRCodeSVG value={scanUrl(qr.token)} size={220} /></div>
            <p className="mt-3 text-xs break-all text-ink-400">{scanUrl(qr.token)}</p>
            <p className="mt-2 text-sm text-ink-500">Tampilkan di layar atau cetak. Peserta memindai dengan kamera ponsel.</p>
          </div>
        )}
      </Modal>
    </AdminPage>
  )
}
