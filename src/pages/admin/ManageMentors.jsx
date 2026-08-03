import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ManageMentors() {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', angkatan_bimbing: '', prodi: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('mentors')
      .select('*')
      .order('angkatan_bimbing')
      .order('name')
    setMentors(data ?? [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('mentors').insert({
      name: form.name.trim(),
      angkatan_bimbing: form.angkatan_bimbing.trim(),
      prodi: form.prodi.trim(),
    })
    setForm({ name: '', angkatan_bimbing: '', prodi: '' })
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus kakak bimbing ini?')) return
    await supabase.from('mentors').delete().eq('id', id)
    fetchData()
  }

  // Kelompokkan per angkatan bimbing
  const grouped = mentors.reduce((acc, m) => {
    const key = m.angkatan_bimbing
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const filtered = mentors.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.angkatan_bimbing.includes(search)
  )

  const filteredGrouped = filtered.reduce((acc, m) => {
    const key = m.angkatan_bimbing
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors">
              ← Dashboard
            </Link>
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="text-sm font-medium">Kakak Bimbing</span>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all">
            + Tambah
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-[#C9A84C]/30 bg-[#111827]">
            <h2 className="font-semibold mb-5 text-[#C9A84C]">Tambah Kakak Bimbing</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nama kakak bimbing"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Kakak bimbing angkatan</label>
                  <input
                    type="text"
                    placeholder="contoh: 2023"
                    value={form.angkatan_bimbing}
                    onChange={e => setForm({...form, angkatan_bimbing: e.target.value})}
                    required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Prodi (opsional)</label>
                  <input
                    type="text"
                    placeholder="contoh: Teknik Informatika"
                    value={form.prodi}
                    onChange={e => setForm({...form, prodi: e.target.value})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-[#C9A84C] text-[#080d17] font-semibold rounded-xl text-sm hover:bg-[#D4B483] disabled:opacity-50 transition-all">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.keys(grouped).sort().map(angkatan => (
            <div key={angkatan} className="p-4 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] text-center">
              <div className="text-2xl font-bold text-[#C9A84C]">{grouped[angkatan].length}</div>
              <div className="text-[#F5F0E8]/40 text-xs mt-1">Kakak bimbing angkatan {angkatan}</div>
            </div>
          ))}
        </div>

        <input
          type="text"
          placeholder="Cari nama atau angkatan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-6 bg-[#111827] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
        />

        {loading ? (
          <div className="text-center text-[#F5F0E8]/30 py-10 text-sm animate-pulse">Memuat...</div>
        ) : (
          Object.keys(filteredGrouped).sort().map(angkatan => (
            <div key={angkatan} className="mb-8">
              <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-4 pb-2 border-b border-[#C9A84C]/10 flex justify-between">
                <span>Kakak Bimbing Angkatan {angkatan}</span>
                <span>{filteredGrouped[angkatan].length} orang</span>
              </div>
              <div className="flex flex-col gap-3">
                {filteredGrouped[angkatan].map(m => (
                  <div key={m.id} className="p-4 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#C9A84C] text-sm font-bold">{m.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.name}</div>
                      {m.prodi && <div className="text-[#F5F0E8]/40 text-xs">{m.prodi}</div>}
                    </div>
                    <button onClick={() => handleDelete(m.id)}
                      className="px-3 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all">
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}