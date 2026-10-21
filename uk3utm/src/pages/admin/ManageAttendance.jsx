import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ManageAttendance() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)

  // Naikkan angka ini untuk memuat ulang data (setelah hapus / ada absensi baru).
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [sessRes, attRes] = await Promise.all([
        supabase.from('sessions').select('*, locations(name)').eq('id', sessionId).maybeSingle(),
        supabase.from('attendances').select('*').eq('session_id', sessionId).order('angkatan').order('scanned_at'),
      ])
      if (cancelled) return
      setSession(sessRes.data)
      setAttendances(attRes.data ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [sessionId, refreshKey])

  useEffect(() => {
    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendances',
        filter: `session_id=eq.${sessionId}`,
      }, refresh)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [sessionId, refresh])

  async function handleDelete(id) {
    if (!confirm('Hapus data absensi ini?')) return
    await supabase.from('attendances').delete().eq('id', id)
    refresh()
  }

  // Kelompokkan per angkatan
  const grouped = attendances.reduce((acc, a) => {
    const key = a.angkatan || 'Tidak Diketahui'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const angkatanList = Object.keys(grouped).sort()

  // ✅ Fungsi loadImageAsBase64 dengan CORS handling + logging
  async function loadImageAsBase64(url) {
    try {
      console.log('[loadImageAsBase64] Fetching:', url)
      const res = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
      })
      console.log('[loadImageAsBase64] Response:', res.status, res.ok)
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
      
      const blob = await res.blob()
      console.log('[loadImageAsBase64] Blob:', blob.size, blob.type)
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          console.log('[loadImageAsBase64] Base64 length:', reader.result?.length)
          resolve(reader.result)
        }
        reader.onerror = (e) => {
          console.error('[loadImageAsBase64] FileReader error:', e)
          reject(e)
        }
        reader.readAsDataURL(blob)
      })
    } catch (err) {
      console.warn('[loadImageAsBase64] FAILED:', url, err.message)
      return null
    }
  }

  // ✅ Fungsi exportPDF dengan kolom Kakak Bimbing + debug logging
  async function exportPDF() {
    console.log('🚀 exportPDF started')
    
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageW = doc.internal.pageSize.getWidth()

    // ✅ Load semua TTD di awal dengan for...of (lebih predictable)
    const allSigMap = {}
    console.log(`📦 Starting to load ${attendances.length} signatures...`)
    
    for (const a of attendances) {
      if (a.signature_url) {
        console.log(`⏳ Loading TTD for ${a.nim} (${a.name})`)
        const b64 = await loadImageAsBase64(a.signature_url)
        if (b64) {
          allSigMap[a.id] = b64
          console.log(`✅ Loaded: ${a.nim}`)
        } else {
          console.log(`❌ Failed: ${a.nim}`)
        }
      }
    }

    // 🐛 DEBUG LOGS LENGKAP
    console.log('=== 🧪 DEBUG EXPORT PDF ===')
    console.log('Total peserta:', attendances.length)
    console.log('Peserta dengan signature_url:', attendances.filter(a => a.signature_url).length)
    console.log('TTD berhasil diload:', Object.keys(allSigMap).length)
    console.log('allSigMap keys:', Object.keys(allSigMap))
    
    if (attendances[0]?.signature_url) {
      console.log('Sample signature_url:', attendances[0].signature_url)
      try {
        const testFetch = await fetch(attendances[0].signature_url, { 
          mode: 'cors', 
          cache: 'no-cache',
          headers: { 'Accept': 'image/png,image/*' }
        })
        console.log('🔍 Fetch test - Status:', testFetch.status, 'OK:', testFetch.ok)
        console.log('🔍 Fetch test - Headers:', Object.fromEntries(testFetch.headers.entries()))
        const contentType = testFetch.headers.get('content-type')
        console.log('🔍 Content-Type:', contentType)
      } catch (e) {
        console.log('🔍 Fetch test ERROR:', e.name, e.message)
      }
    }
    console.log('=== 🧪 END DEBUG ===')

    let yPos = 15

    // KOP SURAT
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('UNIT KEGIATAN KEROHANIAN KRISTEN', pageW / 2, yPos, { align: 'center' })
    yPos += 6
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Universitas Trunojoyo Madura', pageW / 2, yPos, { align: 'center' })
    yPos += 5
    doc.text('Persekutuan Doa Revive', pageW / 2, yPos, { align: 'center' })
    yPos += 4
    doc.setDrawColor(201, 168, 76)
    doc.setLineWidth(0.8)
    doc.line(14, yPos, pageW - 14, yPos)
    yPos += 8

    // JUDUL
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DAFTAR HADIR PERSEKUTUAN DOA', pageW / 2, yPos, { align: 'center' })
    yPos += 6
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(session?.title ?? '', pageW / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    const tgl = session
      ? new Date(session.date).toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      : ''
    doc.text(
      `${tgl}${session?.locations ? ' · ' + session.locations.name : ''}`,
      pageW / 2, yPos, { align: 'center' }
    )
    doc.setTextColor(0, 0, 0)
    yPos += 10

    // TABEL PER ANGKATAN
    for (const angkatan of angkatanList) {
      const members = grouped[angkatan]

      // Cek apakah perlu halaman baru
      if (yPos > 230) {
        doc.addPage()
        yPos = 15
      }

      // Header angkatan
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(201, 168, 76)
      doc.text(`Angkatan ${angkatan}  (${members.length} orang)`, 14, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 5

      autoTable(doc, {
        startY: yPos,
        head: [['No', 'Nama', 'NIM', 'Kakak Bimbing', 'Jam', 'Tanda Tangan']],
        body: members.map((a, i) => [
          i + 1,
          a.name,
          a.nim,
          a.kakak_bimbing || '-',  // ✅ Kolom Kakak Bimbing
          new Date(a.scanned_at).toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit',
          }),
          '', // kolom TTD dikosongkan, diisi di didDrawCell
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [201, 168, 76],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 40 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35 },  // ✅ Kolom Kakak Bimbing
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 35, halign: 'center', minCellHeight: 18 },
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const member = members[data.row.index]
            const sig = member ? allSigMap[member.id] : null
            
            console.log(`[didDrawCell] Row ${data.row.index}, Member: ${member?.nim}, Has Sig: ${!!sig}`)
            
            if (sig) {
              try {
                doc.addImage(
                  sig,
                  'PNG',
                  data.cell.x + 2,
                  data.cell.y + 1,
                  31,
                  14
                )
                console.log(`[didDrawCell] ✅ Image added for ${member?.nim}`)
              } catch (e) {
                console.warn(`[didDrawCell] ❌ Gagal tambah TTD:`, e.message)
              }
            } else {
              console.log(`[didDrawCell] ⚠️ No signature found for ${member?.nim}`)
            }
          }
        },
        margin: { left: 14, right: 14 },
      })

      yPos = doc.lastAutoTable.finalY + 10
    }

    // TOTAL
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Kehadiran: ${attendances.length} orang`, 14, yPos)
    yPos += 14

    // TTD KOORDINATOR
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Mengetahui,', pageW - 60, yPos)
    yPos += 22
    doc.line(pageW - 70, yPos, pageW - 14, yPos)
    yPos += 5
    doc.text('Koordinator Pembinaan', pageW - 68, yPos)

    // FOOTER
    const footerY = doc.internal.pageSize.getHeight() - 10
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(
      `Dicetak otomatis · Sistem Absensi UK3 UTM · ${new Date().toLocaleDateString('id-ID')}`,
      pageW / 2, footerY, { align: 'center' }
    )

    console.log('💾 Saving PDF...')
    doc.save(`absensi-${session?.title ?? 'pd'}.pdf`)
    console.log('✅ exportPDF completed')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080d17] flex items-center justify-center">
      <div className="text-[#C9A84C] text-sm animate-pulse">Memuat...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">

      {/* TOPBAR */}
      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin/sesi" className="text-[#F5F0E8]/40 hover:text-[#C9A84C] text-sm transition-colors">
              ← Sesi PD
            </Link>
            <span className="text-[#F5F0E8]/20">/</span>
            <span className="text-sm font-medium">Daftar Hadir</span>
          </div>
          <button onClick={exportPDF}
            className="px-4 py-2 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full text-xs hover:bg-[#D4B483] transition-all">
            Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Info Sesi */}
        <div className="mb-8 p-5 rounded-2xl border border-[#C9A84C]/20 bg-[#111827]">
          <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-1">Sesi</div>
          <h2 className="font-bold text-lg mb-1">{session?.title}</h2>
          <div className="text-[#F5F0E8]/40 text-sm">
            {session && new Date(session.date).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
            {session?.locations && ` · ${session.locations.name}`}
          </div>
          <div className="mt-3 text-[#C9A84C] font-bold text-2xl">
            {attendances.length}
            <span className="text-[#F5F0E8]/30 text-sm font-normal ml-1">peserta hadir</span>
          </div>
        </div>

        {/* List per angkatan */}
        {attendances.length === 0 ? (
          <div className="text-center text-[#F5F0E8]/30 py-20 text-sm">Belum ada peserta yang absen.</div>
        ) : (
          angkatanList.map(angkatan => (
            <div key={angkatan} className="mb-8">
              <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-4 pb-2 border-b border-[#C9A84C]/10 flex justify-between">
                <span>Angkatan {angkatan}</span>
                <span>{grouped[angkatan].length} orang</span>
              </div>
              <div className="flex flex-col gap-3">
                {grouped[angkatan].map((a, i) => (
                  <div key={a.id} className="p-4 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#C9A84C] text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{a.name}</div>
                      <div className="text-[#F5F0E8]/40 text-xs">
                        {a.nim} · {a.angkatan}
                      </div>
                      {/* ✅ Tampilkan Kakak Bimbing */}
                      {a.kakak_bimbing && (
                        <div className="text-[#C9A84C]/80 text-xs">
                          👤 Kakak Bimbing: {a.kakak_bimbing}
                        </div>
                      )}
                      <div className="text-[#F5F0E8]/20 text-xs">
                        {new Date(a.scanned_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {a.signature_url && (
                      <img src={a.signature_url} alt="TTD"
                        className="h-10 w-24 object-contain bg-white rounded-lg p-1" />
                    )}
                    <button onClick={() => handleDelete(a.id)}
                      className="px-3 py-1 border border-red-500/30 text-red-400 rounded-full text-xs hover:bg-red-500/10 transition-all flex-shrink-0">
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}