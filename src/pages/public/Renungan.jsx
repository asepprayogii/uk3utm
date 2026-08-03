import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Renungan() {
  const [data, setData] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('devotionals').select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setData(data ?? []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-12">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Firman</div>
          <h1 className="text-3xl font-bold" style={{fontFamily:'Cinzel,serif'}}>Renungan</h1>
        </div>

        {loading && <div className="text-center text-[#F5F0E8]/30 animate-pulse">Memuat...</div>}

        {selected ? (
          <div>
            <button onClick={() => setSelected(null)}
              className="text-[#C9A84C] text-sm mb-6 hover:underline">? Kembali</button>
            {selected.image_url && (
              <img src={selected.image_url} className="w-full h-56 object-cover rounded-2xl mb-6" />
            )}
            {selected.verse && (
              <div className="text-[#C9A84C] italic text-sm mb-4">"{selected.verse}"</div>
            )}
            <h2 className="text-2xl font-bold mb-4">{selected.title}</h2>
            <p className="text-[#F5F0E8]/70 leading-relaxed whitespace-pre-line">{selected.content}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {data.map(d => (
              <div key={d.id} onClick={() => setSelected(d)}
                className="p-5 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] hover:border-[#C9A84C]/30 transition-all cursor-pointer">
                {d.image_url && (
                  <img src={d.image_url} className="w-full h-36 object-cover rounded-xl mb-4" />
                )}
                {d.verse && <div className="text-[#C9A84C] text-xs italic mb-2">"{d.verse}"</div>}
                <h3 className="font-semibold mb-2">{d.title}</h3>
                <p className="text-[#F5F0E8]/50 text-sm line-clamp-3">{d.content}</p>
                <div className="text-[#F5F0E8]/20 text-xs mt-3">
                  {new Date(d.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                </div>
              </div>
            ))}
            {!loading && data.length === 0 && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm col-span-2">Belum ada renungan.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
