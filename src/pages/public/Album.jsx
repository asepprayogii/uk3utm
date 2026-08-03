import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Album() {
  const [albums, setAlbums] = useState([])
  const [selected, setSelected] = useState(null)
  const [photos, setPhotos] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('albums')
        .select('*')
        .order('event_date', { ascending: false })
      setAlbums(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  async function openAlbum(album) {
    setSelected(album)
    const { data } = await supabase
      .from('album_photos')
      .select('*')
      .eq('album_id', album.id)
      .order('order_index')
    setPhotos(data ?? [])
  }

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      <Navbar />

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="foto"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20 transition-all"
          >
            ✕
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 pt-28 pb-20">

        {/* BACK */}
        {selected && (
          <button
            onClick={() => { setSelected(null); setPhotos([]) }}
            className="mb-6 text-[#C9A84C] text-sm hover:underline flex items-center gap-2"
          >
            ← Kembali ke Album
          </button>
        )}

        {!selected ? (
          <>
            <div className="text-center mb-10">
              <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Momen Bersama</div>
              <h1 className="text-3xl font-bold" style={{fontFamily:'Cinzel,serif'}}>Album Kegiatan</h1>
            </div>

            {loading && (
              <div className="text-center text-[#F5F0E8]/30 py-20 animate-pulse text-sm">Memuat...</div>
            )}
            {!loading && albums.length === 0 && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">Belum ada album.</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {albums.map(a => (
                <div
                  key={a.id}
                  onClick={() => openAlbum(a)}
                  className="rounded-2xl border border-[#C9A84C]/10 bg-[#111827] overflow-hidden cursor-pointer hover:border-[#C9A84C]/40 transition-all group"
                >
                  {a.cover_url ? (
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={a.cover_url}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-[#C9A84C]/5 flex items-center justify-center">
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
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1">{selected.title}</h1>
              {selected.event_date && (
                <div className="text-[#F5F0E8]/40 text-sm">
                  {new Date(selected.event_date).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              )}
              {selected.description && (
                <p className="text-[#F5F0E8]/60 text-sm mt-3 leading-relaxed">{selected.description}</p>
              )}
            </div>

            {photos.length === 0 && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">Belum ada foto.</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map(p => (
                <div
                  key={p.id}
                  onClick={() => setLightbox(p.photo_url)}
                  className="aspect-square rounded-xl overflow-hidden cursor-zoom-in group"
                >
                  <img
                    src={p.photo_url}
                    alt={p.caption ?? ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}