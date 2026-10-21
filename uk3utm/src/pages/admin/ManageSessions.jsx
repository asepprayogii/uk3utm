import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

export default function ManageSessions() {
  const [sessions, setSessions] = useState([])
  const [archived, setArchived] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showQR, setShowQR] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location_id: '',
    type: 'pd'
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [sessRes, archRes, locRes] = await Promise.all([
      supabase.from('sessions')
        .select('*, locations(name)')
        .eq('archived', false)
        .order('created_at', { ascending: false }),
      supabase.from('sessions')
        .select('*, locations(name)')
        .eq('archived', true)
        .order('archived_at', { ascending: false }),
      supabase.from('locations').select('*').order('name'),
    ])
    setSessions(sessRes.data ?? [])
    setArchived(archRes.data ?? [])
    setLocations(locRes.data ?? [])
    if (locRes.data?.length > 0)
      setForm(f => ({...f, location_id: locRes.data[0].id}))
    setLoading(false)
  }

  function generateToken() {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const token = generateToken()
    await supabase.from('sessions').insert({
      ...form,
      token,
      status: 'active',
      archived: false,
    })
    setForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      location_id: locations[0]?.id ?? '',
      type: 'pd'
    })
    setShowForm(false)
    fetchAll()
  }

  async function toggleStatus(id, status) {
    await supabase.from('sessions')
      .update({ status: status === 'active' ? 'closed' : 'active' })
      .eq('id', id)
    fetchAll()
  }

  // ARSIP — sembunyikan tapi data tetap ada
  async function handleArchive(id) {
    await supabase.from('sessions').update({
      archived: true,
      archived_at: new Date().toISOString(),
      status: 'closed'
    }).eq('id', id)
    fetchAll()
  }

  // PULIHKAN dari arsip
  async function handleRestore(id) {
    await supabase.from('sessions').update({
      archived: false,
      archived_at: null
    }).eq('id', id)
    fetchAll()
  }

  // HAPUS PERMANEN
  async function handleDeletePermanent(id) {
    await supabase.from('sessions').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchAll()
  }

  const scanUrl = (token) => `${window.location.origin}/scan/${token}`

  function SessionCard({ s, isArchived }) {
    return (
      <div className={`p-5 rounded-2xl border bg-[#111827] ${
        isArchived ? 'border-[#F5F0E8]/5 opacity-70' : 'border-[#C9A84C]/15'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{s.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                s.type === 'event'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-[#C9A84C]/20 text-[#C9A84C]'
              }`}>
                {s.type === 'event' ? 'Event' : 'PD'}
              </span>
            </div>
            <div className="text-[#F5F0E8]/40 text-xs">
              {new Date(s.date).toLocaleDateString('id-ID', {
                weekday:'long', day:'numeric', month:'long', year:'numeric'
              })}
              {s.locations && ` · ${s.locations.name}`}
            </div>
            {isArchived && s.archived_at && (
              <div className="text-[#F5F0E8]/20 text-xs mt-1">
                Diarsipkan {new Date(s.archived_at).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>
          {!isArchived && (
            <span className={`text-xs px-3 py-1 rounded-full ${
              s.status === 'active'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-[#F5F0E8]/10 text-[#F5F0E8]/40'
            }`}>
              {s.status === 'active' ? '● Aktif' : '○ Tutup'}
            </span>
          )}
          {isArchived && (
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500/60">
              📦 Arsip
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {!isArchived && (
            <>
              <button onClick={() => setShowQR(s)}
                className="px-3 py-1.5 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all">
                Tampilkan QR
              </button>
              <Link to={`/admin/absensi/${s.id}`}
                className="px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
                Lihat Absensi
              </Link>
              <button onClick={() => toggleStatus(s.id, s.status)}
                className="px-3 py-1.5 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 rounded-full text-xs hover:bg-[#F5F0E8]/5 transition-all">
                {s.status === 'active' ? 'Tutup Sesi' : 'Buka Lagi'}
              </button>
              <button onClick={() => handleArchive(s.id)}
                className="px-3 py-1.5 border border-yellow-500/30 text-yellow-500/70 rounded-full text-xs hover:bg-yellow-500/10 transition-all">
                📦 Arsip
              </button>
            </>
          )}

          {isArchived && (
            <>
              <Link to={`/admin/absensi/${s.id}`}
                className="px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
                Lihat Absensi
              </Link>
              <button onClick={() => handleRestore(s.id)}
                className="px-3 py-1.5 border border-green-500/30 text-green-400 rounded-full text-xs hover:bg-green-500/10 transition-all">
                ↩ Pulihkan
              </button>
            </>
          )}

          {/* Hapus permanen selalu ada tapi lebih tersembunyi */}
          <button onClick={() => setDeleteConfirm(s)}
            className="px-3 py-1.5 border border-red-500/20 text-red-400/60 rounded-full text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all">
            Hapus Permanen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      {/* TOPBAR */}
      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors">
              ← Dashboard
            </Link>
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="text-sm font-medium">Sesi PD</span>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all">
            + Buat Sesi
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* FORM */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-[#C9A84C]/30 bg-[#111827]">
            <h2 className="font-semibold mb-5 text-[#C9A84C]">Buat Sesi Baru</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nama sesi (contoh: PD Revive Minggu 1)"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Jenis</label>
                  <select value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60">
                    <option value="pd">Persekutuan Doa</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Tanggal</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                    required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60" />
                </div>
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Lokasi</label>
                  <select value={form.location_id}
                    onChange={e => setForm({...form, location_id: e.target.value})}
                    required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60">
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit"
                  className="px-6 py-2.5 bg-[#C9A84C] text-[#080d17] font-semibold rounded-xl text-sm hover:bg-[#D4B483] transition-all">
                  Buat & Generate QR
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* QR MODAL */}
        {showQR && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl p-8 max-w-sm w-full text-center">
              <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">QR Absensi</div>
              <h3 className="font-semibold mb-1">{showQR.title}</h3>
              <div className={`text-xs mb-4 px-2 py-0.5 rounded-full inline-block ${
                showQR.type === 'event'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-[#C9A84C]/20 text-[#C9A84C]'
              }`}>
                {showQR.type === 'event' ? 'Event' : 'Persekutuan Doa'}
              </div>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG value={scanUrl(showQR.token)} size={200} />
              </div>
              <div className="text-[#F5F0E8]/30 text-xs mb-6 break-all">{scanUrl(showQR.token)}</div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => window.open(scanUrl(showQR.token), '_blank')}
                  className="px-4 py-2 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
                  Buka Link
                </button>
                <button onClick={() => setShowQR(null)}
                  className="px-4 py-2 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 rounded-full text-xs hover:bg-[#F5F0E8]/5 transition-all">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">⚠</span>
              </div>
              <h3 className="font-semibold mb-2">Hapus Permanen?</h3>
              <p className="text-[#F5F0E8]/50 text-sm mb-2">
                Sesi <span className="text-[#F5F0E8] font-medium">"{deleteConfirm.title}"</span> akan dihapus beserta semua data absensinya.
              </p>
              <p className="text-red-400/70 text-xs mb-6">Tindakan ini tidak bisa dibatalkan!</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 py-2.5 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all">
                  Batal
                </button>
                <button onClick={() => handleDeletePermanent(deleteConfirm.id)}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm hover:bg-red-600 transition-all">
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SESI AKTIF */}
        {loading ? (
          <div className="text-center text-[#F5F0E8]/30 py-10 text-sm animate-pulse">Memuat...</div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-8">
              {sessions.length === 0 ? (
                <div className="text-center text-[#F5F0E8]/30 py-16 text-sm">
                  Belum ada sesi. Klik "+ Buat Sesi" untuk memulai.
                </div>
              ) : (
                sessions.map(s => <SessionCard key={s.id} s={s} isArchived={false} />)
              )}
            </div>

            {/* ARSIP */}
            {archived.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-[#F5F0E8]/10 text-[#F5F0E8]/40 text-sm hover:bg-[#F5F0E8]/5 transition-all mb-4"
                >
                  <span>📦 Arsip Sesi ({archived.length})</span>
                  <span>{showArchived ? '▲' : '▼'}</span>
                </button>

                {showArchived && (
                  <div className="flex flex-col gap-4">
                    {archived.map(s => <SessionCard key={s.id} s={s} isArchived={true} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}