import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Pengumuman() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
      setAnnouncements(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Info Terkini</div>
          <h1 className="text-3xl font-bold" style={{fontFamily:'Cinzel,serif'}}>Pengumuman</h1>
        </div>

        {loading && (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm animate-pulse">Memuat...</div>
        )}

        {!loading && announcements.length === 0 && (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
            Belum ada pengumuman.
          </div>
        )}

        <div className="flex flex-col gap-5">
          {announcements.map(a => (
            <div key={a.id} className={`rounded-2xl border bg-[#111827] overflow-hidden transition-all hover:border-[#C9A84C]/40 ${
              a.pinned ? 'border-[#C9A84C]/40' : 'border-[#C9A84C]/10'
            }`}>
              {a.image_url && (
                <img src={a.image_url} alt={a.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {a.pinned && (
                    <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full">
                      📌 Pinned
                    </span>
                  )}
                  <span className="text-[#F5F0E8]/30 text-xs">
                    {new Date(a.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <h2 className="font-semibold text-lg mb-2">{a.title}</h2>
                <p className="text-[#F5F0E8]/60 text-sm leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}