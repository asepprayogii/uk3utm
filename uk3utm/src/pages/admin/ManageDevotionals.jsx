import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ManageDevotionals() {
  const [devotionals, setDevotionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', verse: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('devotionals').select('*')
      .order('created_at', { ascending: false })
    setDevotionals(data ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditData(null)
    setForm({ title: '', content: '', verse: '' })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  function openEdit(d) {
    setEditData(d)
    setForm({ title: d.title, content: d.content, verse: d.verse ?? '' })
    setImageFile(null)
    setImagePreview(d.image_url ?? null)
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

    let image_url = editData?.image_url ?? null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `devotionals/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('uk3-media').upload(filename, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('uk3-media').getPublicUrl(filename)
        image_url = urlData.publicUrl
      }
    }

    if (editData) {
      await supabase.from('devotionals')
        .update({ ...form, image_url })
        .eq('id', editData.id)
    } else {
      await supabase.from('devotionals')
        .insert({ ...form, image_url })
    }

    setForm({ title: '', content: '', verse: '' })
    setImageFile(null)
    setImagePreview(null)
    setEditData(null)
    setShowForm(false)
    setUploading(false)
    fetchData()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus renungan ini?')) return
    await supabase.from('devotionals').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors">
              ← Dashboard
            </Link>
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="text-sm font-medium">Renungan</span>
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
                  {editData ? 'Edit Renungan' : 'Renungan Baru'}
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Judul renungan"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />
                  <input
                    type="text"
                    placeholder="Ayat Alkitab (contoh: Yohanes 3:16)"
                    value={form.verse}
                    onChange={e => setForm({...form, verse: e.target.value})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                  />
                  <textarea
                    placeholder="Isi renungan..."
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                    required
                    rows={7}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 resize-none"
                  />

                  <div onClick={() => fileRef.current.click()}
                    className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-5 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all">
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} className="max-h-40 mx-auto rounded-lg object-cover" />
                        <div className="text-[#F5F0E8]/30 text-xs mt-2">Klik untuk ganti gambar</div>
                      </div>
                    ) : (
                      <div className="text-[#F5F0E8]/30 text-sm">Klik untuk upload gambar (opsional)</div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                  </div>

                  {imagePreview && (
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="text-red-400/60 text-xs hover:text-red-400 transition-colors text-left">
                      ✕ Hapus gambar
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
        <div className="flex flex-col gap-4">
          {loading && <div className="text-center text-[#F5F0E8]/30 py-10 text-sm animate-pulse">Memuat...</div>}
          {!loading && devotionals.length === 0 && (
            <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
              Belum ada renungan. Klik "+ Tambah".
            </div>
          )}
          {devotionals.map(d => (
            <div key={d.id} className="p-5 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex gap-4">
              {d.image_url && (
                <img src={d.image_url} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {d.verse && <div className="text-[#C9A84C] text-xs italic mb-1">"{d.verse}"</div>}
                <h3 className="font-semibold text-sm mb-1">{d.title}</h3>
                <p className="text-[#F5F0E8]/50 text-xs line-clamp-2 mb-2">{d.content}</p>
                <div className="text-[#F5F0E8]/20 text-xs mb-3">
                  {new Date(d.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(d)}
                    className="px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(d.id)}
                    className="px-3 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}