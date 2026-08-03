import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Pengumuman() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('announcements').select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => { setData(data ?? []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-12">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Info</div>
          <h1 className="text-3xl font-bold" style={{fontFamily:'Cinzel,serif'}}>Pengumuman</h1>
        </div>

        {loading && <div className="text-center text-[#F5F0E8]/30 animate-pulse">Memuat...</div>}

        <div className="flex flex-col gap-5">
          {data.map(a => (
            <div key={a.id} className="p-6 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] hover:border-[#C9A84C]/30 transition-all">
              {a.pinned && (
                <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full mb-3 inline-block">?? Pinned</span>
              )}
              {a.image_url && (
                <img src={a.image_url} alt={a.title} className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              <div className="text-[#C9A84C] text-xs mb-2">
                {new Date(a.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
              </div>
              <h2 className="font-semibold text-lg mb-2">{a.title}</h2>
              <p className="text-[#F5F0E8]/60 text-sm leading-relaxed whitespace-pre-line">{a.content}</p>
            </div>
          ))}
          {!loading && data.length === 0 && (
            <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">Belum ada pengumuman.</div>
          )}
        </div>
      </div>
    </div>
  )
}
