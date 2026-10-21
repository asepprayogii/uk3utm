import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Download, MapPin, Trash2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime } from '../../lib/format'
import { exportAttendancePdf } from '../../lib/exportAttendancePdf'
import { useUI } from '../../hooks/useUI'
import AdminPage, { Card } from '../../components/admin/AdminPage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { EmptyState, ErrorState, Loading } from '../../components/States'

export default function ManageAttendance() {
  const { sessionId } = useParams()
  const { toast, confirm } = useUI()
  const [session, setSession] = useState(null)
  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sessRes, attRes] = await Promise.all([
          supabase.from('sessions').select('*, locations(name)').eq('id', sessionId).maybeSingle(),
          supabase.from('attendances').select('*').eq('session_id', sessionId).order('angkatan').order('scanned_at'),
        ])
        if (sessRes.error) throw sessRes.error
        if (attRes.error) throw attRes.error
        if (cancelled) return
        setSession(sessRes.data)
        setAttendances(attRes.data ?? [])
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId, refreshKey])

  // Peserta yang baru absen langsung muncul tanpa muat ulang.
  useEffect(() => {
    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendances', filter: `session_id=eq.${sessionId}` }, refresh)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [sessionId, refresh])

  async function remove(a) {
    if (!(await confirm({ title: `Hapus absensi ${a.name}?`, message: 'Data kehadiran ini akan dihapus dari sesi.', confirmLabel: 'Ya, hapus' }))) return
    const { error: err } = await supabase.from('attendances').delete().eq('id', a.id)
    if (err) toast.error(`Gagal menghapus: ${err.message}`)
    else refresh()
  }

  async function exportPdf() {
    setExporting(true)
    try {
      const missing = await exportAttendancePdf(session, attendances)
      if (missing > 0) toast.info(`PDF dibuat, tetapi ${missing} tanda tangan tidak bisa dimuat.`)
      else toast.success('PDF berhasil dibuat.')
    } catch (e) {
      toast.error(`Gagal membuat PDF: ${e.message}`)
    } finally {
      setExporting(false)
    }
  }

  const grouped = attendances.reduce((acc, a) => {
    ;(acc[a.angkatan || 'Tidak Diketahui'] ??= []).push(a)
    return acc
  }, {})
  const angkatanList = Object.keys(grouped).sort()

  if (loading) return <Loading />
  if (error) return <ErrorState message="Daftar hadir gagal dimuat." onRetry={() => { setLoading(true); refresh() }} />

  return (
    <AdminPage
      title={session?.title ?? 'Daftar Hadir'}
      description={session ? `${formatDate(session.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${session.locations ? ` · ${session.locations.name}` : ''}` : 'Sesi tidak ditemukan.'}
      action={
        <div className="flex gap-2">
          <Button variant="secondary" icon={ArrowLeft} to="/admin/sesi">Kembali</Button>
          <Button icon={Download} loading={exporting} disabled={attendances.length === 0} onClick={exportPdf}>Unduh PDF</Button>
        </div>
      }
    >
      <Card className="mb-8 flex items-center gap-4 p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Users size={22} /></span>
        <div>
          <div className="text-3xl font-bold text-brand-900">{attendances.length}</div>
          <div className="text-sm text-ink-500">peserta hadir · diperbarui otomatis saat ada yang absen</div>
        </div>
        {session && <div className="ml-auto hidden sm:block"><Badge tone={session.status === 'active' ? 'green' : 'gray'}>{session.status === 'active' ? 'Absensi dibuka' : 'Ditutup'}</Badge></div>}
      </Card>

      {attendances.length === 0 && <Card><EmptyState icon={MapPin} title="Belum ada yang absen">Tampilkan QR dari halaman Sesi Absensi agar peserta bisa memindai.</EmptyState></Card>}

      <div className="flex flex-col gap-8">
        {angkatanList.map((angkatan) => (
          <section key={angkatan}>
            <h2 className="mb-3 flex justify-between border-b border-paper-300 pb-2 text-sm font-bold tracking-wide text-brand-800 uppercase"><span>Angkatan {angkatan}</span><span className="text-ink-400">{grouped[angkatan].length} orang</span></h2>
            <div className="flex flex-col gap-2">
              {grouped[angkatan].map((a, i) => (
                <Card key={a.id} className="flex items-center gap-3 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink-900">{a.name}</div>
                    <div className="text-xs text-ink-500">{a.nim} · {formatTime(a.scanned_at)}{a.kakak_bimbing ? ` · KK: ${a.kakak_bimbing}` : ''}</div>
                  </div>
                  {a.signature_url && <img src={a.signature_url} alt="Tanda tangan" className="hidden h-10 w-24 rounded-lg border border-paper-300 bg-white object-contain p-1 sm:block" />}
                  <button type="button" onClick={() => remove(a)} aria-label={`Hapus absensi ${a.name}`} className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminPage>
  )
}
