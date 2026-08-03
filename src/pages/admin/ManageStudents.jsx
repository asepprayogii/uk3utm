import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [search, setSearch] = useState('')
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('name')
    setStudents(data ?? [])
    setLoading(false)
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      // Normalize kolom — case insensitive
      const normalized = rows.map(row => {
        const lower = {}
        Object.keys(row).forEach(k => { lower[k.toLowerCase().trim()] = row[k] })
        return {
          name: (lower['nama'] ?? lower['name'] ?? '').toString().trim(),
          prodi: (lower['prodi'] ?? lower['program studi'] ?? '').toString().trim(),
          kakak_bimbing: (lower['kakak bimbing'] ?? lower['kakak_bimbing'] ?? lower['mentor'] ?? '').toString().trim(),
        }
      }).filter(r => r.name)

      if (normalized.length === 0) {
        setUploadResult({ success: 0, skip: 0, error: 'Tidak ada data valid. Pastikan kolom NAMA ada.' })
        setUploading(false)
        return
      }

      // Upsert by name
      let success = 0, skip = 0
      for (const student of normalized) {
        const { error } = await supabase
          .from('students')
          .upsert({ name: student.name, prodi: student.prodi, kakak_bimbing: student.kakak_bimbing },
            { onConflict: 'name', ignoreDuplicates: false })
        if (error) skip++
        else success++
      }

      setUploadResult({ success, skip, total: normalized.length })
      fetchData()
    } catch (err) {
      setUploadResult({ error: 'Gagal baca file: ' + err.message })
    }

    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(id) {
    if (!confirm('Hapus mahasiswa ini?')) return
    await supabase.from('students').delete().eq('id', id)
    fetchData()
  }

  async function handleDeleteAll() {
    if (!confirm('Hapus SEMUA data mahasiswa? Tindakan ini tidak bisa dibatalkan!')) return
    await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    fetchData()
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.nim ?? '').includes(search) ||
    (s.prodi ?? '').toLowerCase().includes(search.toLowerCase())
  )

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
            <span className="text-sm font-medium">Data Mahasiswa</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] disabled:opacity-50 transition-all"
            >
              {uploading ? 'Mengupload...' : '↑ Upload Excel'}
            </button>
            {students.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all"
              >
                Hapus Semua
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Panduan format */}
        <div className="mb-6 p-4 rounded-2xl border border-[#C9A84C]/20 bg-[#111827]">
          <div className="text-[#C9A84C] text-xs font-semibold mb-2">Format Excel yang diterima</div>
          <div className="text-[#F5F0E8]/50 text-xs">
            Kolom wajib: <span className="text-[#F5F0E8]">NAMA</span> · 
            Kolom opsional: <span className="text-[#F5F0E8]">PRODI</span>, <span className="text-[#F5F0E8]">KAKAK BIMBING</span>
          </div>
          <div className="text-[#F5F0E8]/30 text-xs mt-1">NIM akan diisi otomatis saat mahasiswa pertama kali absen.</div>
        </div>

        {/* Upload result */}
        {uploadResult && (
          <div className={`mb-6 p-4 rounded-2xl border text-sm ${
            uploadResult.error
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-green-500/30 bg-green-500/10 text-green-400'
          }`}>
            {uploadResult.error ? uploadResult.error : (
              <>✓ Berhasil import <strong>{uploadResult.success}</strong> mahasiswa
              {uploadResult.skip > 0 && ` · ${uploadResult.skip} dilewati (duplikat)`}</>
            )}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Cari nama, NIM, atau prodi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 bg-[#111827] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Mahasiswa', value: students.length },
            { label: 'Sudah ada NIM', value: students.filter(s => s.nim).length },
            { label: 'Belum ada NIM', value: students.filter(s => !s.nim).length },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] text-center">
              <div className="text-2xl font-bold text-[#C9A84C]">{s.value}</div>
              <div className="text-[#F5F0E8]/40 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-[#F5F0E8]/30 py-10 text-sm animate-pulse">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
            {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data. Upload Excel untuk mulai.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(s => (
              <div key={s.id} className="p-4 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C9A84C] text-sm font-bold">{s.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-[#F5F0E8]/40 text-xs mt-0.5">
                    {s.nim ? `NIM: ${s.nim}` : <span className="text-yellow-500/70">NIM belum diisi</span>}
                    {s.prodi && ` · ${s.prodi}`}
                    {s.angkatan && ` · ${s.angkatan}`}
                  </div>
                  {s.kakak_bimbing && (
                    <div className="text-[#C9A84C]/60 text-xs mt-0.5">Kakak Bimbing: {s.kakak_bimbing}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="px-3 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all flex-shrink-0"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}