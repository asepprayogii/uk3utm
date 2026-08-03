import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Renungan() {
  const [devotionals, setDevotionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('devotionals')
        .select('*')
        .order('created_at', { ascending: false })
      setDevotionals(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Firman Tuhan</div>
          <h1 className="text-3xl font-bold" style={{fontFamily:'Cinzel,serif'}}>Renungan</h1>
        </div>

        {loading && (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm animate-pulse">Memuat...</div>
        )}

        {!loading && devotionals.length === 0 && (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">Belum ada renungan.</div>
        )}

        <div className="flex flex-col gap-5">
          {devotionals.map(d => (
            <div key={d.id}
              className="rounded-2xl border border-[#C9A84C]/10 bg-[#111827] overflow-hidden hover:border-[#C9A84C]/40 transition-all cursor-pointer"
              onClick={() => setSelected(selected?.id === d.id ? null : d)}
            >
              {d.image_url && (
                <img src={d.image_url} alt={d.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                {d.verse && (
                  <div className="text-[#C9A84C] text-xs italic mb-2">"{d.verse}"</div>
                )}
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-lg mb-2 flex-1">{d.title}</h2>
                  <span className="text-[#F5F0E8]/30 text-lg ml-4">
                    {selected?.id === d.id ? '↑' : '↓'}
                  </span>
                </div>
                <div className="text-[#F5F0E8]/30 text-xs mb-3">
                  {new Date(d.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>

                {selected?.id === d.id ? (
                  <p className="text-[#F5F0E8]/70 text-sm leading-relaxed whitespace-pre-line border-t border-[#C9A84C]/10 pt-4 mt-2">
                    {d.content}
                  </p>
                ) : (
                  <p className="text-[#F5F0E8]/50 text-sm line-clamp-2">{d.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}