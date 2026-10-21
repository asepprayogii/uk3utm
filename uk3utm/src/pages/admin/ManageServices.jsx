import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Heart, HandHeart, BookOpen, MessageCircle,
  Package, Megaphone, Music, Dumbbell, Palette, Users
} from 'lucide-react'

const SERVICE_ICONS = [
  { key: 'HandHeart', label: 'Pelayanan', Icon: HandHeart },
  { key: 'BookOpen', label: 'Doa/Rohani', Icon: BookOpen },
  { key: 'MessageCircle', label: 'Konseling', Icon: MessageCircle },
  { key: 'Heart', label: 'Kasih/Donasi', Icon: Heart },
  { key: 'Package', label: 'Inventaris', Icon: Package },
  { key: 'Megaphone', label: 'Pengumuman', Icon: Megaphone },
  { key: 'Music', label: 'Musik', Icon: Music },
  { key: 'Dumbbell', label: 'Olahraga', Icon: Dumbbell },
  { key: 'Palette', label: 'Kreatif', Icon: Palette },
  { key: 'Users', label: 'Komunitas', Icon: Users },
]

function ServiceIcon({ iconKey, className }) {
  const found = SERVICE_ICONS.find(i => i.key === iconKey)
  if (!found) return <HandHeart className={className} />
  const { Icon } = found
  return <Icon className={className} />
}

export default function ManageServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', icon: 'HandHeart',
    cp_name: '', cp_wa: '', cp_name2: '', cp_wa2: '',
    form_url: '', order_index: 0, is_active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [qrisFile, setQrisFile] = useState(null)
  const [qrisPreview, setQrisPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const imageRef = useRef()
  const qrisRef = useRef()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('services').select('*').order('order_index')
    setServices(data ?? [])
    setLoading(false)
  }

  function openEdit(s) {
    setEditItem(s)
    setForm({
      title: s.title, description: s.description ?? '',
      icon: s.icon ?? 'HandHeart', cp_name: s.cp_name ?? '',
      cp_wa: s.cp_wa ?? '', cp_name2: s.cp_name2 ?? '',
      cp_wa2: s.cp_wa2 ?? '', form_url: s.form_url ?? '',
      order_index: s.order_index ?? 0, is_active: s.is_active
    })
    setImagePreview(s.image_url ?? null)
    setQrisPreview(s.qris_url ?? null)
    setImageFile(null)
    setQrisFile(null)
  }

  function openAdd() {
    setEditItem({})
    setForm({
      title: '', description: '', icon: 'HandHeart',
      cp_name: '', cp_wa: '', cp_name2: '', cp_wa2: '',
      form_url: '', order_index: services.length, is_active: true
    })
    setImagePreview(null)
    setQrisPreview(null)
    setImageFile(null)
    setQrisFile(null)
  }

  async function uploadFile(file, folder) {
    const ext = file.name.split('.').pop()
    const filename = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('uk3-media').upload(filename, file)
    if (error) return null
    const { data } = supabase.storage.from('uk3-media').getPublicUrl(filename)
    return data.publicUrl
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    const payload = { ...form }

    if (imageFile) {
      const url = await uploadFile(imageFile, 'services/images')
      if (url) payload.image_url = url
    } else if (editItem?.id) {
      payload.image_url = editItem.image_url ?? null
    }

    if (qrisFile) {
      const url = await uploadFile(qrisFile, 'services/qris')
      if (url) payload.qris_url = url
    } else if (editItem?.id) {
      payload.qris_url = editItem.qris_url ?? null
    }

    if (editItem?.id) {
      await supabase.from('services').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('services').insert(payload)
    }

    setEditItem(null)
    setSaving(false)
    fetchData()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus layanan ini?')) return
    await supabase.from('services').delete().eq('id', id)
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
            <span className="text-sm font-medium">Layanan</span>
          </div>
          <button onClick={openAdd}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all">
            + Tambah
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* FORM MODAL */}
        {editItem !== null && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl w-full max-w-lg my-4">
              <div className="p-6">
                <h2 className="font-semibold text-[#C9A84C] mb-5">
                  {editItem.id ? 'Edit Layanan' : 'Tambah Layanan'}
                </h2>
                <form onSubmit={handleSave} className="flex flex-col gap-4">

                  <input type="text" placeholder="Nama layanan" value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})} required
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60" />

                  <textarea placeholder="Deskripsi singkat" value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})} rows={2}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 resize-none" />

                  {/* Pilih Icon */}
                  <div>
                    <div className="text-xs text-[#F5F0E8]/40 mb-2">Icon</div>
                    <div className="grid grid-cols-5 gap-2">
                      {SERVICE_ICONS.map(({ key, label, Icon }) => (
                        <button key={key} type="button"
                          onClick={() => setForm({...form, icon: key})}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                            form.icon === key
                              ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                              : 'border-[#F5F0E8]/10 hover:border-[#C9A84C]/30 hover:bg-[#F5F0E8]/5'
                          }`}>
                          <Icon size={18} className={form.icon === key ? 'text-[#C9A84C]' : 'text-[#F5F0E8]/50'} />
                          <span className="text-[8px] text-[#F5F0E8]/40">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Gambar */}
                  <div>
                    <div className="text-xs text-[#F5F0E8]/40 mb-2">Gambar layanan (opsional)</div>
                    <div onClick={() => imageRef.current.click()}
                      className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-4 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all">
                      {imagePreview ? (
                        <img src={imagePreview} className="max-h-32 mx-auto rounded-lg object-cover" />
                      ) : (
                        <div className="text-[#F5F0E8]/30 text-xs py-4">Klik untuk upload gambar</div>
                      )}
                      <input ref={imageRef} type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files[0]
                          if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
                        }} />
                    </div>
                  </div>

                  {/* Upload QRIS */}
                  <div>
                    <div className="text-xs text-[#F5F0E8]/40 mb-2">QRIS / Barcode donasi (opsional)</div>
                    <div onClick={() => qrisRef.current.click()}
                      className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-4 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all">
                      {qrisPreview ? (
                        <img src={qrisPreview} className="max-h-40 mx-auto rounded-lg object-contain bg-white p-2" />
                      ) : (
                        <div className="text-[#F5F0E8]/30 text-xs py-4">Klik untuk upload QRIS / Barcode</div>
                      )}
                      <input ref={qrisRef} type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files[0]
                          if (f) { setQrisFile(f); setQrisPreview(URL.createObjectURL(f)) }
                        }} />
                    </div>
                  </div>

                  <input type="text" placeholder="Link Google Form (opsional)" value={form.form_url}
                    onChange={e => setForm({...form, form_url: e.target.value})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60" />

                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Nama CP 1" value={form.cp_name}
                      onChange={e => setForm({...form, cp_name: e.target.value})}
                      className="bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60" />
                    <input type="text" placeholder="No WA CP 1 (628xxx)" value={form.cp_wa}
                      onChange={e => setForm({...form, cp_wa: e.target.value})}
                      className="bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60" />
                    <input type="text" placeholder="Nama CP 2 (opsional)" value={form.cp_name2}
                      onChange={e => setForm({...form, cp_name2: e.target.value})}
                      className="bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60" />
                    <input type="text" placeholder="No WA CP 2 (opsional)" value={form.cp_wa2}
                      onChange={e => setForm({...form, cp_wa2: e.target.value})}
                      className="bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60" />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active}
                      onChange={e => setForm({...form, is_active: e.target.checked})}
                      className="accent-[#C9A84C]" />
                    <span className="text-sm text-[#F5F0E8]/60">Tampilkan di website</span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="flex-1 bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl text-sm hover:bg-[#D4B483] disabled:opacity-50 transition-all">
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button type="button" onClick={() => setEditItem(null)}
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
          {loading && <div className="text-center text-[#F5F0E8]/30 py-10 animate-pulse text-sm">Memuat...</div>}
          {services.map(s => (
            <div key={s.id} className="p-5 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                <ServiceIcon iconKey={s.icon} className="w-5 h-5 text-[#C9A84C]" />
              </div>
              {s.image_url && (
                <img src={s.image_url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  {!s.is_active && (
                    <span className="text-xs bg-[#F5F0E8]/10 text-[#F5F0E8]/30 px-2 py-0.5 rounded-full">Hidden</span>
                  )}
                  {s.qris_url && (
                    <span className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full">QRIS ✓</span>
                  )}
                </div>
                {s.cp_name && <div className="text-xs text-[#F5F0E8]/40">CP: {s.cp_name} · {s.cp_wa}</div>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(s)}
                  className="px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
                  Edit
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}