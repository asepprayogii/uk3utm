import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

const DEPARTMENTS = ['Pembinaan', 'Dopiper', 'Penatalayanan', 'Minat Bakat']

export default function Kepengurusan() {
  const [committee, setCommittee] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('committee')
        .select('*')
        .order('level')
        .order('order_index')
      setCommittee(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const pembina = committee.filter(c => c.department === 'Pembina')
  const pembimbing = committee.filter(c => c.department === 'Pembimbing')
  const bph = committee.filter(c => c.department === 'BPH')
  const byDept = Object.fromEntries(
    DEPARTMENTS.map(d => [d, committee.filter(c => c.department === d)])
  )

  function Avatar({ member, size = 'md' }) {
    const sz = {
      xl: 'w-24 h-24 text-3xl',
      lg: 'w-20 h-20 text-2xl',
      md: 'w-14 h-14 text-lg',
      sm: 'w-12 h-12 text-base',
    }[size] ?? 'w-14 h-14 text-lg'

    return member.photo_url ? (
      <img src={member.photo_url} alt={member.name}
        className={`${sz} rounded-full object-cover mx-auto border-2 border-[#C9A84C]/30`} />
    ) : (
      <div className={`${sz} rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C]/30 flex items-center justify-center mx-auto`}>
        <span className="text-[#C9A84C] font-bold">{member.name[0]}</span>
      </div>
    )
  }

  function Card({ member, size = 'md', badge }) {
    return (
      <div className="text-center p-4 rounded-2xl border border-[#C9A84C]/20 bg-[#111827] hover:border-[#C9A84C]/40 transition-all">
        <Avatar member={member} size={size} />
        <div className="font-semibold mt-3 mb-0.5 text-sm">{member.name}</div>
        <div className="text-[#C9A84C] text-xs mb-1">{member.position}</div>
        {member.division && <div className="text-[#F5F0E8]/30 text-xs">{member.division}</div>}
        {badge && (
          <div className="mt-2 inline-block text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full">
            {badge}
          </div>
        )}
      </div>
    )
  }

  // Garis konektor vertikal
  function VLine() {
    return (
      <div className="flex justify-center my-2">
        <div className="w-px h-8 bg-[#C9A84C]/30" />
      </div>
    )
  }

  // Garis konektor horizontal ke beberapa cabang
  function HBranch({ count }) {
    if (count <= 1) return <VLine />
    return (
      <div className="flex justify-center my-2">
        <div className="relative w-full max-w-3xl">
          <div className="w-px h-6 bg-[#C9A84C]/30 mx-auto" />
          <div className="border-t border-[#C9A84C]/30 mx-8" />
          <div className="flex justify-between px-8">
            {Array.from({length: count}).map((_, i) => (
              <div key={i} className="w-px h-6 bg-[#C9A84C]/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeDepts = DEPARTMENTS.filter(d => (byDept[d] ?? []).length > 0)

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">

        {/* HEADER */}
        <div className="text-center mb-14">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Struktur Organisasi</div>
          <h1 className="text-3xl font-bold" style={{fontFamily:'Cinzel,serif'}}>Kepengurusan UK3 UTM</h1>
          <p className="text-[#F5F0E8]/40 text-sm mt-2">Periode 2025/2026</p>
        </div>

        {loading && (
          <div className="text-center text-[#F5F0E8]/30 py-20 animate-pulse text-sm">Memuat...</div>
        )}

        {!loading && (
          <div className="flex flex-col items-center">

            {/* PEMBINA */}
            {pembina.length > 0 && (
              <>
                <div className="w-full mb-2">
                  <div className="text-center mb-3">
                    <span className="text-xs tracking-widest uppercase px-4 py-1.5 border border-[#C9A84C]/20 text-[#C9A84C]/60 rounded-full">
                      Pembina
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {pembina.map(m => <Card key={m.id} member={m} size="md" />)}
                  </div>
                </div>
                <VLine />
              </>
            )}

            {/* PEMBIMBING */}
            {pembimbing.length > 0 && (
              <>
                <div className="w-full mb-2">
                  <div className="text-center mb-3">
                    <span className="text-xs tracking-widest uppercase px-4 py-1.5 border border-[#C9A84C]/20 text-[#C9A84C]/60 rounded-full">
                      Pembimbing
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {pembimbing.map(m => <Card key={m.id} member={m} size="md" />)}
                  </div>
                </div>
                <VLine />
              </>
            )}

            {/* BPH */}
            {bph.length > 0 && (
              <>
                <div className="w-full mb-2">
                  <div className="text-center mb-3">
                    <span className="text-xs tracking-widest uppercase px-4 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full bg-[#C9A84C]/5">
                      Badan Pengurus Harian
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {bph.map(m => (
                      <Card key={m.id} member={m} size="lg" badge={m.is_kadep ? m.position : null} />
                    ))}
                  </div>
                </div>

                {activeDepts.length > 0 && (
                  <>
                    <VLine />
                    {/* Garis cabang ke departemen */}
                    <div className="w-full max-w-3xl flex justify-center">
                      <div className="relative w-full">
                        <div className="border-t border-[#C9A84C]/30 w-full" />
                        <div className={`flex justify-between`}>
                          {activeDepts.map((_, i) => (
                            <div key={i} className="w-px h-6 bg-[#C9A84C]/30" style={{
                              marginLeft: i === 0 ? '12.5%' : undefined,
                              marginRight: i === activeDepts.length - 1 ? '12.5%' : undefined,
                              flex: i > 0 && i < activeDepts.length - 1 ? 1 : undefined,
                              ...(activeDepts.length > 2 && { position: 'relative' })
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* DEPARTEMEN */}
            {activeDepts.length > 0 && (
              <div className={`w-full grid gap-8 mt-0`}
                style={{gridTemplateColumns: `repeat(${Math.min(activeDepts.length, 4)}, 1fr)`}}>

                {activeDepts.map(dept => {
                  const members = byDept[dept] ?? []
                  const kadep = members.find(m => m.is_kadep)
                  const anggota = members.filter(m => !m.is_kadep)

                  return (
                    <div key={dept} className="flex flex-col items-center">

                      {/* Label departemen */}
                      <div className="text-center mb-3 px-3 py-1.5 border border-[#C9A84C]/20 rounded-full bg-[#0d1525]">
                        <span className="text-xs text-[#C9A84C] tracking-wider">{dept}</span>
                      </div>

                      {/* Kepala Departemen */}
                      {kadep && (
                        <>
                          <div className="w-full">
                            <Card member={kadep} size="md" badge="Kepala Dept" />
                          </div>
                          {anggota.length > 0 && <VLine />}
                        </>
                      )}

                      {/* Anggota per divisi */}
                      {anggota.length > 0 && (
                        <div className="w-full flex flex-col gap-2">
                          {anggota.map(m => (
                            <Card key={m.id} member={m} size="sm" />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}