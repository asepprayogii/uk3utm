import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

const DEPARTMENTS = ['Pembinaan', 'Dopiper', 'Penatalayanan', 'Minat Bakat']
const DIVISIONS = {
  'Pembinaan': ['Kelompok Besar', 'Kelompok Kecil'],
  'Dopiper': ['Doa', 'Penginjilan', 'Pemerhati'],
  'Penatalayanan': ['Infokom', 'Inventaris'],
  'Minat Bakat': ['Creative Ministry', 'Musik', 'Olahraga'],
}

const BPH_ORDER = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara']

function getAutoOrder(position, department, is_kadep) {
  if (department === 'Pembina') return 0
  if (department === 'Pembimbing') return 1
  if (department === 'BPH') {
    const idx = BPH_ORDER.findIndex(p => position.toLowerCase().includes(p.toLowerCase()))
    return idx >= 0 ? 10 + idx : 14
  }
  if (is_kadep) return 20
  return 30
}

export default function Kepengurusan() {
  const [committee, setCommittee] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('committee').select('*')
      const sorted = (data ?? []).sort((a, b) => {
        const oA = getAutoOrder(a.position, a.department, a.is_kadep)
        const oB = getAutoOrder(b.position, b.department, b.is_kadep)
        if (oA !== oB) return oA - oB
        return a.name.localeCompare(b.name)
      })
      setCommittee(sorted)
      setLoading(false)
    }
    fetchData()
  }, [])

  const pembina = committee.filter(c => c.department === 'Pembina')
  const pembimbing = committee.filter(c => c.department === 'Pembimbing')
  const bph = committee.filter(c => c.department === 'BPH')
  const byDept = Object.fromEntries(
    DEPARTMENTS.map(dept => {
      const members = committee.filter(c => c.department === dept)
      const kadep = members.find(m => m.is_kadep)
      const byDiv = Object.fromEntries(
        (DIVISIONS[dept] ?? []).map(div => [
          div, members.filter(m => !m.is_kadep && m.division === div)
        ])
      )
      return [dept, { kadep, byDiv, members }]
    })
  )

  function Avatar({ member, size = 'md' }) {
    const sz = {
      xl: 'w-24 h-24 text-3xl',
      lg: 'w-20 h-20 text-2xl',
      md: 'w-16 h-16 text-xl',
      sm: 'w-12 h-12 text-base',
      xs: 'w-10 h-10 text-sm',
    }[size]
    return member.photo_url ? (
      <img src={member.photo_url} alt={member.name}
        className={`${sz} rounded-full object-cover border-2 border-[#C9A84C]/30 flex-shrink-0`} />
    ) : (
      <div className={`${sz} rounded-full bg-[#C9A84C]/20 border-2 border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0`}>
        <span className="text-[#C9A84C] font-bold">{member.name[0]}</span>
      </div>
    )
  }

  // Card untuk BPH — tampil besar di tengah
  function BPHCard({ member }) {
    return (
      <div className="text-center p-6 rounded-2xl border-2 border-[#C9A84C]/30 bg-[#111827] hover:border-[#C9A84C]/60 transition-all min-w-[150px]">
        <div className="flex justify-center mb-3">
          <Avatar member={member} size="lg" />
        </div>
        <div className="font-semibold text-sm mb-0.5">{member.name}</div>
        <div className="text-[#C9A84C] text-xs">{member.position}</div>
      </div>
    )
  }

  // Row untuk departemen — foto kecil di kiri, nama & jabatan di kanan
  function MemberRow({ member, badge, indent = false }) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border border-[#C9A84C]/10 bg-[#111827] hover:border-[#C9A84C]/25 transition-all ${indent ? 'ml-6' : ''}`}>
        <Avatar member={member} size="xs" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{member.name}</div>
          <div className="text-[#C9A84C] text-xs">{member.position}</div>
        </div>
        {badge && (
          <span className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-0.5 rounded-full flex-shrink-0">
            {badge}
          </span>
        )}
      </div>
    )
  }

  function SectionTitle({ label, sub }) {
    return (
      <div className="flex items-center gap-4 mb-5">
        <div className="h-px flex-1 bg-[#C9A84C]/10" />
        <div className="text-center">
          <div className="text-xs tracking-widest uppercase px-4 py-1.5 border border-[#C9A84C]/20 text-[#C9A84C] rounded-full bg-[#C9A84C]/5">
            {label}
          </div>
          {sub && <div className="text-[#F5F0E8]/20 text-xs mt-1">{sub}</div>}
        </div>
        <div className="h-px flex-1 bg-[#C9A84C]/10" />
      </div>
    )
  }

  // Garis konektor vertikal
  function VLine() {
    return <div className="flex justify-center my-3"><div className="w-px h-8 bg-[#C9A84C]/20" /></div>
  }

  const activeDepts = DEPARTMENTS.filter(d => byDept[d].members.length > 0)

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
          <div className="flex flex-col">

            {/* PEMBINA */}
            {pembina.length > 0 && (
              <>
                <SectionTitle label="Pembina" />
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {pembina.map(m => <BPHCard key={m.id} member={m} />)}
                </div>
                <VLine />
              </>
            )}

            {/* PEMBIMBING */}
            {pembimbing.length > 0 && (
              <>
                <SectionTitle label="Pembimbing" />
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {pembimbing.map(m => <BPHCard key={m.id} member={m} />)}
                </div>
                <VLine />
              </>
            )}

            {/* BPH */}
            {bph.length > 0 && (
              <>
                <SectionTitle label="Badan Pengurus Harian" />
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {bph.map(m => <BPHCard key={m.id} member={m} />)}
                </div>
                {activeDepts.length > 0 && <VLine />}
              </>
            )}

            {/* DEPARTEMEN — grid */}
            {activeDepts.length > 0 && (
              <>
                {/* Garis cabang horizontal */}
                {activeDepts.length > 1 && (
                  <div className="relative flex justify-center mb-0">
                    <div className="w-3/4 border-t border-[#C9A84C]/20" />
                  </div>
                )}

                <div className="grid gap-6 mt-0"
                  style={{ gridTemplateColumns: `repeat(${Math.min(activeDepts.length, 2)}, 1fr)` }}>

                  {activeDepts.map(dept => {
                    const { kadep, byDiv, members } = byDept[dept]

                    return (
                      <div key={dept} className="pt-6">
                        {/* Label departemen */}
                        <div className="text-center mb-4">
                          <span className="text-xs tracking-widest uppercase px-3 py-1.5 border border-[#C9A84C]/20 text-[#C9A84C] rounded-full bg-[#0d1525]">
                            {dept}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">

                          {/* Kepala Departemen */}
                          {kadep && (
                            <MemberRow member={kadep} badge="Kadep" />
                          )}

                          {/* Anggota per divisi — indent ke dalam */}
                          {(DIVISIONS[dept] ?? []).map(div => {
                            const divMembers = byDiv[div] ?? []
                            if (divMembers.length === 0) return null
                            return (
                              <div key={div}>
                                {/* Label divisi */}
                                <div className="flex items-center gap-2 my-2 pl-2">
                                  <div className="w-3 h-px bg-[#C9A84C]/20" />
                                  <span className="text-[#F5F0E8]/30 text-xs">{div}</span>
                                </div>
                                {/* Anggota divisi */}
                                <div className="flex flex-col gap-1.5">
                                  {divMembers.map(m => (
                                    <MemberRow key={m.id} member={m} indent />
                                  ))}
                                </div>
                              </div>
                            )
                          })}

                          {/* Anggota tanpa divisi */}
                          {members.filter(m => !m.is_kadep && !m.division).map(m => (
                            <MemberRow key={m.id} member={m} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {committee.length === 0 && (
              <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">
                Belum ada data kepengurusan.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}