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

// Urutan jabatan BPH — otomatis, tidak perlu isi manual
const BPH_ORDER = [
  'Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara',
]

function getAutoOrder(position, department, is_kadep) {
  if (department === 'Pembina') return 0
  if (department === 'Pembimbing') return 1
  if (department === 'BPH') {
    const idx = BPH_ORDER.findIndex(p =>
      position.toLowerCase().includes(p.toLowerCase())
    )
    return idx >= 0 ? 10 + idx : 14
  }
  if (is_kadep) return 20
  return 30
}

// Didefinisikan di luar komponen agar tidak dibuat ulang (dan kehilangan state) tiap render.
function Avatar({ member, size = 'md' }) {
  const sz = {
    lg: 'w-16 h-16 text-xl',
    md: 'w-12 h-12 text-base',
    sm: 'w-10 h-10 text-sm',
  }[size]
  return member.photo_url ? (
    <img src={member.photo_url} alt={member.name}
      className={`${sz} rounded-full object-cover flex-shrink-0 border-2 border-[#C9A84C]/20`} />
  ) : (
    <div className={`${sz} rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0`}>
      <span className="text-[#C9A84C] font-bold">{member.name?.[0] ?? '?'}</span>
    </div>
  )
}

function MemberRow({ member, badge, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#C9A84C]/10 bg-[#0d1525] hover:border-[#C9A84C]/25 transition-all">
      <Avatar member={member} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{member.name}</div>
        <div className="text-[#C9A84C] text-xs">{member.position}</div>
        {badge && (
          <div className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full inline-block mt-1">
            {badge}
          </div>
        )}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button onClick={() => onEdit(member)}
          className="px-2.5 py-1 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
          Edit
        </button>
        <button onClick={() => onDelete(member.id)}
          className="px-2.5 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all">
          Hapus
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-3 pb-2 border-b border-[#C9A84C]/10">
      {label}
    </div>
  )
}

export default function ManageCommittee() {
  const [committee, setCommittee] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({
    name: '', position: '', department: 'BPH', division: '', is_kadep: false
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('committee')
      .select('*')
    // Sort di client berdasarkan auto order
    const sorted = (data ?? []).sort((a, b) => {
      const orderA = getAutoOrder(a.position, a.department, a.is_kadep)
      const orderB = getAutoOrder(b.position, b.department, b.is_kadep)
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
    setCommittee(sorted)
    setLoading(false)
  }

  function openAdd() {
    setEditData(null)
    setForm({ name: '', position: '', department: 'BPH', division: '', is_kadep: false })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  function openEdit(member) {
    setEditData(member)
    setForm({
      name: member.name,
      position: member.position,
      department: member.department ?? 'BPH',
      division: member.division ?? '',
      is_kadep: member.is_kadep ?? false,
    })
    setImagePreview(member.photo_url ?? null)
    setImageFile(null)
    setShowForm(true)
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

    let photo_url = editData?.photo_url ?? null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `committee/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('uk3-media').upload(filename, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('uk3-media').getPublicUrl(filename)
        photo_url = urlData.publicUrl
      }
    }

    const order_index = getAutoOrder(form.position, form.department, form.is_kadep)
    const level = form.department === 'BPH' || form.department === 'Pembina' || form.department === 'Pembimbing'
      ? 1 : form.is_kadep ? 2 : 3

    if (editData) {
      await supabase.from('committee')
        .update({ ...form, photo_url, order_index, level })
        .eq('id', editData.id)
    } else {
      await supabase.from('committee')
        .insert({ ...form, photo_url, order_index, level })
    }

    setForm({ name: '', position: '', department: 'BPH', division: '', is_kadep: false })
    setImageFile(null)
    setImagePreview(null)
    setEditData(null)
    setShowForm(false)
    setUploading(false)
    fetchData()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus pengurus ini?')) return
    await supabase.from('committee').delete().eq('id', id)
    fetchData()
  }

  // Kelompokkan sesuai struktur
  const pembina = committee.filter(c => c.department === 'Pembina')
  const pembimbing = committee.filter(c => c.department === 'Pembimbing')
  const bph = committee.filter(c => c.department === 'BPH')

  // Per departemen → per divisi
  const byDept = Object.fromEntries(
    DEPARTMENTS.map(dept => {
      const members = committee.filter(c => c.department === dept)
      const kadep = members.find(m => m.is_kadep)
      const byDiv = Object.fromEntries(
        (DIVISIONS[dept] ?? []).map(div => [
          div, members.filter(m => !m.is_kadep && m.division === div)
        ])
      )
      return [dept, { kadep, byDiv, members }]
    })
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
            <span className="text-sm font-medium">Kepengurusan</span>
          </div>
          <button onClick={openAdd}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all">
            + Tambah
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="font-semibold mb-5 text-[#C9A84C]">
                  {editData ? 'Edit Pengurus' : 'Tambah Pengurus'}
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />

                  <input
                    type="text"
                    placeholder="Jabatan (contoh: Ketua, Wakil Ketua, Sekretaris...)"
                    value={form.position}
                    onChange={e => setForm({...form, position: e.target.value})}
                    required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />

                  <div>
                    <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Departemen</label>
                    <select
                      value={form.department}
                      onChange={e => setForm({...form, department: e.target.value, division: '', is_kadep: false})}
                      className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                    >
                      <option value="Pembina">Pembina</option>
                      <option value="Pembimbing">Pembimbing</option>
                      <option value="BPH">BPH</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Divisi — hanya muncul kalau bukan BPH/Pembina/Pembimbing */}
                  {!['BPH','Pembina','Pembimbing'].includes(form.department) && (
                    <div>
                      <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Divisi</label>
                      <select
                        value={form.division}
                        onChange={e => setForm({...form, division: e.target.value})}
                        className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                      >
                        <option value="">Pilih divisi</option>
                        {DIVISIONS[form.department]?.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Kepala Departemen — hanya kalau bukan BPH/Pembina/Pembimbing */}
                  {!['BPH','Pembina','Pembimbing'].includes(form.department) && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_kadep}
                        onChange={e => setForm({...form, is_kadep: e.target.checked})}
                        className="accent-[#C9A84C]" />
                      <span className="text-sm text-[#F5F0E8]/60">Kepala Departemen</span>
                    </label>
                  )}

                  {/* Preview urutan otomatis */}
                  {form.position && (
                    <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-xl px-4 py-2 text-xs text-[#F5F0E8]/40">
                      Urutan tampil otomatis berdasarkan jabatan dan departemen ✓
                    </div>
                  )}

                  {/* Upload foto */}
                  <div onClick={() => fileRef.current.click()}
                    className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-5 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all">
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} className="w-20 h-20 mx-auto rounded-full object-cover" />
                        <div className="text-[#F5F0E8]/30 text-xs mt-2">Klik untuk ganti foto</div>
                      </div>
                    ) : (
                      <div className="text-[#F5F0E8]/30 text-sm">Klik untuk upload foto profil (opsional)</div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                  </div>

                  {imagePreview && (
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="text-red-400/60 text-xs hover:text-red-400 transition-colors text-left">
                      ✕ Hapus foto
                    </button>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={uploading}
                      className="flex-1 bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl text-sm hover:bg-[#D4B483] disabled:opacity-50 transition-all">
                      {uploading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah'}
                    </button>
                    <button type="button"
                      onClick={() => { setShowForm(false); setEditData(null); setImagePreview(null) }}
                      className="flex-1 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 py-3 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all">
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        {loading ? (
          <div className="text-center text-[#F5F0E8]/30 py-10 text-sm animate-pulse">Memuat...</div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* PEMBINA */}
            {pembina.length > 0 && (
              <div>
                <SectionLabel label="Pembina" />
                <div className="flex flex-col gap-2">
                  {pembina.map(m => <MemberRow key={m.id} member={m} onEdit={openEdit} onDelete={handleDelete} />)}
                </div>
              </div>
            )}

            {/* PEMBIMBING */}
            {pembimbing.length > 0 && (
              <div>
                <SectionLabel label="Pembimbing" />
                <div className="flex flex-col gap-2">
                  {pembimbing.map(m => <MemberRow key={m.id} member={m} onEdit={openEdit} onDelete={handleDelete} />)}
                </div>
              </div>
            )}

            {/* BPH */}
            {bph.length > 0 && (
              <div>
                <SectionLabel label="Badan Pengurus Harian (BPH)" />
                <div className="flex flex-col gap-2">
                  {bph.map(m => <MemberRow key={m.id} member={m} onEdit={openEdit} onDelete={handleDelete} />)}
                </div>
              </div>
            )}

            {/* DEPARTEMEN */}
            {DEPARTMENTS.map(dept => {
              const { kadep, byDiv, members } = byDept[dept]
              if (members.length === 0) return null

              return (
                <div key={dept}>
                  <SectionLabel label={`Departemen ${dept}`} />
                  <div className="flex flex-col gap-2">

                    {/* Kadep di atas */}
                    {kadep && (
                      <MemberRow member={kadep} badge="Kepala Departemen" onEdit={openEdit} onDelete={handleDelete} />
                    )}

                    {/* Per divisi */}
                    {(DIVISIONS[dept] ?? []).map(div => {
                      const divMembers = byDiv[div] ?? []
                      if (divMembers.length === 0) return null
                      return (
                        <div key={div}>
                          <div className="text-[#F5F0E8]/30 text-xs pl-2 mb-1.5 mt-2">
                            — {div}
                          </div>
                          <div className="flex flex-col gap-1.5 pl-3 border-l border-[#C9A84C]/10">
                            {divMembers.map(m => (
                              <MemberRow key={m.id} member={m} onEdit={openEdit} onDelete={handleDelete} />
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Anggota tanpa divisi */}
                    {members.filter(m => !m.is_kadep && !m.division).map(m => (
                      <MemberRow key={m.id} member={m} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )
            })}

            {committee.length === 0 && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
                Belum ada pengurus. Klik "+ Tambah".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}