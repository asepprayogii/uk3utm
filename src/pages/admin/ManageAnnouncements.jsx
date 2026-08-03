import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', pinned: false })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
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

    let image_url = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `announcements/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('uk3-media')
        .upload(filename, imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('uk3-media')
          .getPublicUrl(filename)
        image_url = urlData.publicUrl
      }
    }

    await supabase.from('announcements').insert({
      ...form,
      image_url,
    })

    setForm({ title: '', content: '', pinned: false })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(false)
    setUploading(false)
    fetchData()
  }

  async function handleDelete(id, image_url) {
    if (!confirm('Hapus pengumuman ini?')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchData()
  }

  async function togglePin(id, pinned) {
    await supabase.from('announcements').update({ pinned: !pinned }).eq('id', id)
    fetchData()
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
            <span className="text-sm font-medium">Pengumuman</span>
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

        {/* FORM TAMBAH */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-[#C9A84C]/30 bg-[#111827]">
            <h2 className="font-semibold mb-5 text-[#C9A84C]">Pengumuman Baru</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Judul pengumuman"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
              <textarea
                placeholder="Isi pengumuman..."
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                required
                rows={4}
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 resize-none"
              />

              {/* Upload gambar */}
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all"
              >
                {imagePreview ? (
                  <img src={imagePreview} className="max-h-40 mx-auto rounded-lg object-cover" />
                ) : (
                  <div className="text-[#F5F0E8]/30 text-sm">Klik untuk upload gambar (opsional)</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm({...form, pinned: e.target.checked})}
                  className="accent-[#C9A84C]"
                />
                <span className="text-sm text-[#F5F0E8]/60">Pin pengumuman ini di atas</span>
              </label>

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

        {/* LIST */}
        <div className="flex flex-col gap-4">
          {loading && (
            <div className="text-center text-[#F5F0E8]/30 py-10 text-sm">Memuat...</div>
          )}
          {!loading && announcements.length === 0 && (
            <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
              Belum ada pengumuman. Klik "+ Tambah" untuk membuat.
            </div>
          )}
          {announcements.map(a => (
            <div key={a.id} className="p-5 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex gap-4">
              {a.image_url && (
                <img src={a.image_url} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{a.title}</h3>
                  {a.pinned && (
                    <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full flex-shrink-0">
                      📌 Pin
                    </span>
                  )}
                </div>
                <p className="text-[#F5F0E8]/50 text-xs line-clamp-2 mb-3">{a.content}</p>
                <div className="text-[#F5F0E8]/30 text-xs mb-3">
                  {new Date(a.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePin(a.id, a.pinned)}
                    className="px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all"
                  >
                    {a.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id, a.image_url)}
                    className="px-3 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all"
                  >
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