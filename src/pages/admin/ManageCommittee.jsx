import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const DEPARTMENTS = ['Pembinaan', 'Dopiper', 'Penatalayanan', 'Minat Bakat']
const DIVISIONS = {
  'Pembinaan': ['Kelompok Besar', 'Kelompok Kecil'],
  'Dopiper': ['Doa', 'Penginjilan', 'Pemerhati'],
  'Penatalayanan': ['Infokom', 'Inventaris'],
  'Minat Bakat': ['Creative Ministry', 'Musik', 'Olahraga'],
}

export default function ManageCommittee() {
  const [committee, setCommittee] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '', position: '', department: 'BPH', division: '', level: 1, is_kadep: false, order_index: 0
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('committee')
      .select('*')
      .order('level')
      .order('order_index')
    setCommittee(data ?? [])
    setLoading(false)
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setUploading(true)

    let photo_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `committee/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('uk3-media')
        .upload(filename, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('uk3-media')
          .getPublicUrl(filename)
        photo_url = urlData.publicUrl
      }
    }

    await supabase.from('committee').insert({ ...form, photo_url })
    setForm({ name: '', position: '', department: 'BPH', division: '', level: 1, is_kadep: false, order_index: 0 })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(false)
    setUploading(false)
    fetchData()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus pengurus ini?')) return
    await supabase.from('committee').delete().eq('id', id)
    fetchData()
  }

  const grouped = {
    Pembina: committee.filter(c => c.department === 'Pembina'),
    Pembimbing: committee.filter(c => c.department === 'Pembimbing'),
    BPH: committee.filter(c => c.department === 'BPH'),
    ...Object.fromEntries(DEPARTMENTS.map(d => [d, committee.filter(c => c.department === d)]))
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
            <span className="text-sm font-medium">Kepengurusan</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all"
          >
            + Tambah
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* FORM */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-[#C9A84C]/30 bg-[#111827]">
            <h2 className="font-semibold mb-5 text-[#C9A84C]">Tambah Pengurus</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nama lengkap"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required
                  className="bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                />
                <input
                  type="text"
                  placeholder="Jabatan (contoh: Ketua Umum)"
                  value={form.position}
                  onChange={e => setForm({...form, position: e.target.value})}
                  required
                  className="bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Departemen</label>
                  <select
                    value={form.department}
                    onChange={e => setForm({...form, department: e.target.value, division: ''})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                  >
                    <option value="Pembina">Pembina</option>
                    <option value="Pembimbing">Pembimbing</option>
                    <option value="BPH">BPH</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {DEPARTMENTS.includes(form.department) && (
                  <div>
                    <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Divisi</label>
                    <select
                      value={form.division}
                      onChange={e => setForm({...form, division: e.target.value})}
                      className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                    >
                      <option value="">Pilih divisi</option>
                      {DIVISIONS[form.department]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Level (1=BPH, 2=Kadep, 3=Anggota)</label>
                  <input
                    type="number"
                    min={1} max={3}
                    value={form.level}
                    onChange={e => setForm({...form, level: parseInt(e.target.value)})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Urutan tampil</label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={e => setForm({...form, order_index: parseInt(e.target.value)})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_kadep}
                  onChange={e => setForm({...form, is_kadep: e.target.checked})}
                  className="accent-[#C9A84C]"
                />
                <span className="text-sm text-[#F5F0E8]/60">Kepala Departemen</span>
              </label>

              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all"
              >
                {imagePreview ? (
                  <img src={imagePreview} className="w-24 h-24 mx-auto rounded-full object-cover" />
                ) : (
                  <div className="text-[#F5F0E8]/30 text-sm">Klik untuk upload foto profil (opsional)</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-[#C9A84C] text-[#080d17] font-semibold rounded-xl text-sm hover:bg-[#D4B483] disabled:opacity-50 transition-all"
                >
                  {uploading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setImagePreview(null) }}
                  className="px-6 py-2.5 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST per grup */}
        {loading ? (
          <div className="text-center text-[#F5F0E8]/30 py-10 text-sm">Memuat...</div>
        ) : (
          Object.entries(grouped).map(([group, members]) => members.length > 0 && (
            <div key={group} className="mb-8">
              <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-4 pb-2 border-b border-[#C9A84C]/10">
                {group}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {members.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] text-center">
                    {m.photo_url ? (
                      <img src={m.photo_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 flex items-center justify-center mx-auto mb-3">
                        <span className="text-[#C9A84C] font-bold text-lg">{m.name[0]}</span>
                      </div>
                    )}
                    <div className="font-medium text-sm mb-0.5">{m.name}</div>
                    <div className="text-[#C9A84C] text-xs mb-1">{m.position}</div>
                    {m.division && <div className="text-[#F5F0E8]/30 text-xs mb-3">{m.division}</div>}
                    {m.is_kadep && (
                      <div className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full mb-2 inline-block">Kadep</div>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="mt-2 px-3 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all"
                    >
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