import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ManageAlbum() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [photos, setPhotos] = useState([])
  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [albumForm, setAlbumForm] = useState({ title: '', description: '', event_date: '' })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const coverRef = useRef()
  const photosRef = useRef()

  useEffect(() => { fetchAlbums() }, [])

  async function fetchAlbums() {
    const { data } = await supabase
      .from('albums')
      .select('*')
      .order('event_date', { ascending: false })
    setAlbums(data ?? [])
    setLoading(false)
  }

  async function fetchPhotos(albumId) {
    const { data } = await supabase
      .from('album_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('order_index')
    setPhotos(data ?? [])
  }

  async function openAlbum(album) {
    setSelected(album)
    await fetchPhotos(album.id)
  }

  function handleCover(e) {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleCreateAlbum(e) {
    e.preventDefault()
    setSaving(true)

    let cover_url = null
    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      const filename = `albums/covers/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('uk3-media')
        .upload(filename, coverFile)
      if (!error) {
        const { data } = supabase.storage.from('uk3-media').getPublicUrl(filename)
        cover_url = data.publicUrl
      }
    }

    const { data: newAlbum } = await supabase
      .from('albums')
      .insert({ ...albumForm, cover_url })
      .select()
      .single()

    setAlbumForm({ title: '', description: '', event_date: '' })
    setCoverFile(null)
    setCoverPreview(null)
    setShowAlbumForm(false)
    setSaving(false)
    fetchAlbums()

    // Langsung buka album baru
    if (newAlbum) openAlbum(newAlbum)
  }

  async function handleUploadPhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length || !selected) return
    setUploadingPhotos(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const filename = `albums/${selected.id}/${Date.now()}_${i}.${ext}`

      const { error } = await supabase.storage
        .from('uk3-media')
        .upload(filename, file)

      if (!error) {
        const { data } = supabase.storage.from('uk3-media').getPublicUrl(filename)
        await supabase.from('album_photos').insert({
          album_id: selected.id,
          photo_url: data.publicUrl,
          order_index: i,
        })
      }
    }

    setUploadingPhotos(false)
    fetchPhotos(selected.id)

    // Update cover kalau belum ada
    if (!selected.cover_url && files.length > 0) {
      const firstPhoto = photos[0]
      if (firstPhoto) {
        await supabase.from('albums').update({ cover_url: firstPhoto.photo_url }).eq('id', selected.id)
        fetchAlbums()
      }
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm('Hapus foto ini?')) return
    await supabase.from('album_photos').delete().eq('id', photoId)
    fetchPhotos(selected.id)
  }

  async function handleDeleteAlbum(albumId) {
    if (!confirm('Hapus album ini beserta semua fotonya?')) return
    await supabase.from('album_photos').delete().eq('album_id', albumId)
    await supabase.from('albums').delete().eq('id', albumId)
    setSelected(null)
    fetchAlbums()
  }

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      {/* TOPBAR */}
      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {selected ? (
              <button
                onClick={() => { setSelected(null); setPhotos([]) }}
                className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors"
              >
                ← Album
              </button>
            ) : (
              <Link to="/admin" className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors">
                ← Dashboard
              </Link>
            )}
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="text-sm font-medium">
              {selected ? selected.title : 'Album Kegiatan'}
            </span>
          </div>

          {!selected ? (
            <button
              onClick={() => setShowAlbumForm(true)}
              className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all"
            >
              + Buat Album
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => photosRef.current.click()}
                disabled={uploadingPhotos}
                className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] disabled:opacity-50 transition-all"
              >
                {uploadingPhotos ? 'Mengupload...' : '+ Upload Foto'}
              </button>
              <input
                ref={photosRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadPhotos}
                className="hidden"
              />
              <button
                onClick={() => handleDeleteAlbum(selected.id)}
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all"
              >
                Hapus Album
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* FORM BUAT ALBUM */}
        {showAlbumForm && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl w-full max-w-md p-6">
              <h2 className="font-semibold text-[#C9A84C] mb-5">Buat Album Baru</h2>
              <form onSubmit={handleCreateAlbum} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nama album (contoh: PD Revive Mei 2026)"
                  value={albumForm.title}
                  onChange={e => setAlbumForm({...albumForm, title: e.target.value})}
                  required
                  className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
                />
                <textarea
                  placeholder="Deskripsi album (opsional)"
                  value={albumForm.description}
                  onChange={e => setAlbumForm({...albumForm, description: e.target.value})}
                  rows={2}
                  className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 resize-none"
                />
                <div>
                  <label className="text-xs text-[#F5F0E8]/40 mb-1 block">Tanggal kegiatan</label>
                  <input
                    type="date"
                    value={albumForm.event_date}
                    onChange={e => setAlbumForm({...albumForm, event_date: e.target.value})}
                    className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] focus:outline-none focus:border-[#C9A84C]/60"
                  />
                </div>

                {/* Cover */}
                <div
                  onClick={() => coverRef.current.click()}
                  className="border-2 border-dashed border-[#C9A84C]/20 rounded-xl p-5 text-center cursor-pointer hover:border-[#C9A84C]/50 transition-all"
                >
                  {coverPreview ? (
                    <img src={coverPreview} className="max-h-32 mx-auto rounded-lg object-cover" />
                  ) : (
                    <div className="text-[#F5F0E8]/30 text-sm">Klik untuk upload foto cover (opsional)</div>
                  )}
                  <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl text-sm hover:bg-[#D4B483] disabled:opacity-50 transition-all"
                  >
                    {saving ? 'Membuat...' : 'Buat Album'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAlbumForm(false); setCoverPreview(null) }}
                    className="flex-1 border border-[#F5F0E8]/20 text-[#F5F0E8]/60 py-3 rounded-xl text-sm hover:bg-[#F5F0E8]/5 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LIST ALBUM */}
        {!selected && (
          <>
            {loading && (
              <div className="text-center text-[#F5F0E8]/30 py-20 animate-pulse text-sm">Memuat...</div>
            )}
            {!loading && albums.length === 0 && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
                Belum ada album. Klik "+ Buat Album" untuk memulai.
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {albums.map(a => (
                <div
                  key={a.id}
                  onClick={() => openAlbum(a)}
                  className="rounded-2xl border border-[#C9A84C]/10 bg-[#111827] overflow-hidden cursor-pointer hover:border-[#C9A84C]/40 transition-all group"
                >
                  {a.cover_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={a.cover_url}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-[#C9A84C]/5 flex items-center justify-center">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{a.title}</h3>
                    {a.event_date && (
                      <div className="text-[#F5F0E8]/30 text-xs">
                        {new Date(a.event_date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ISI ALBUM / FOTO */}
        {selected && (
          <>
            {uploadingPhotos && (
              <div className="mb-6 p-4 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-sm text-center animate-pulse">
                Mengupload foto, mohon tunggu...
              </div>
            )}

            {photos.length === 0 && !uploadingPhotos && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
                Belum ada foto. Klik "+ Upload Foto" untuk menambahkan.
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map(p => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img
                    src={p.photo_url}
                    alt={p.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-all"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}