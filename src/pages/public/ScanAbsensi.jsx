import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import SignatureCanvas from 'react-signature-canvas'

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ✅ Helper: ekstrak angkatan dari NIM (2 digit pertama → 20XX)
function getAngkatanFromNIM(nim) {
  const firstTwo = nim?.slice(0, 2)
  if (firstTwo && /^\d{2}$/.test(firstTwo)) {
    return `20${firstTwo}`
  }
  return ''
}

export default function ScanAbsensi() {
  const { token } = useParams()
  const sigRef = useRef()

  const [step, setStep] = useState('loading') 
  const [session, setSession] = useState(null)
  const [location, setLocation] = useState(null)
  const [gpsCoords, setGpsCoords] = useState(null)
  
  // ✅ Tambah field angkatan (auto) dan kakak_bimbing
  const [form, setForm] = useState({ 
    name: '', 
    nim: '', 
    angkatan: '', 
    kakak_bimbing: '' 
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    validateToken()
  }, [token])

  async function validateToken() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, locations(*)')
      .eq('token', token)
      .maybeSingle()

    if (error || !data) {
      setErrorMsg('Sesi tidak ditemukan atau link tidak valid.')
      setStep('error')
      return
    }

    if (data.status === 'closed') {
      setErrorMsg('Sesi ini sudah ditutup oleh panitia.')
      setStep('error')
      return
    }

    setSession(data)
    setLocation(data.locations)
    setStep('gps')
    requestGPS(data.locations)
  }

  function requestGPS(loc) {
    if (!navigator.geolocation) {
      setErrorMsg('Browser kamu tidak mendukung GPS. Gunakan browser lain.')
      setStep('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsCoords({ lat: latitude, lng: longitude })

        if (loc) {
          const dist = haversineDistance(latitude, longitude, loc.lat, loc.lng)
          if (dist > loc.radius_m) {
            setErrorMsg(`Kamu berada di luar zona PD (${Math.round(dist)}m dari lokasi). Pastikan kamu hadir langsung di tempat.`)
            setStep('error')
            return
          }
        }

        setStep('form')
      },
      (err) => {
        setErrorMsg('Izin lokasi ditolak. GPS wajib diaktifkan untuk absensi.')
        setStep('error')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  // ✅ Handler NIM: auto-fill angkatan
  function handleNIMChange(e) {
    const nim = e.target.value
    const angkatan = getAngkatanFromNIM(nim)
    setForm(prev => ({ ...prev, nim, angkatan }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    // Cek duplikat NIM
    const { data: existing } = await supabase
      .from('attendances')
      .select('id')
      .eq('session_id', session.id)
      .eq('nim', form.nim)
      .maybeSingle()

    if (existing) {
      setErrorMsg('NIM ini sudah melakukan absensi untuk sesi ini.')
      setStep('error')
      return
    }

    // ✅ Simpan tanda tangan dengan logging lengkap
    let signature_url = null
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png')
      const blob = await (await fetch(dataUrl)).blob()
      
      const filename = `signatures/${session.id}/${form.nim}_${Date.now()}.png`
      
      console.log('📤 Uploading TTD...', filename)
      console.log('📊 Blob info:', blob.size, 'bytes,', blob.type)
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('uk3-media')
        .upload(filename, blob, { 
          contentType: 'image/png', 
          upsert: true 
        })
      
      console.log('📥 Upload result:', { uploadData, uploadErr })
      
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('uk3-media')
          .getPublicUrl(filename)
        signature_url = urlData.publicUrl
        console.log('✅ TTD URL:', signature_url)
      } else {
        console.error('❌ Upload error:', uploadErr)
        setErrorMsg('Gagal mengupload tanda tangan. Coba lagi.')
        setStep('error')
        setSubmitting(false)
        return
      }
    } else {
      console.log('⚠️ TTD kosong atau tidak ada')
    }

    // ✅ Insert ke attendances dengan field baru
    console.log('💾 Inserting attendance record...', {
      session_id: session.id,
      name: form.name,
      nim: form.nim,
      angkatan: form.angkatan,
      kakak_bimbing: form.kakak_bimbing,
      signature_url,
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
    })
    
    const { data: insertData, error } = await supabase.from('attendances').insert({
      session_id: session.id,
      name: form.name,
      nim: form.nim,
      angkatan: form.angkatan,
      kakak_bimbing: form.kakak_bimbing,  // ✅ Field baru
      signature_url,
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
    })

    console.log('📥 Insert result:', { insertData, error })

    if (error) {
      console.error('❌ Insert error:', error)
      setErrorMsg('Gagal menyimpan absensi. Coba lagi.')
      setStep('error')
      setSubmitting(false)
      return
    }

    console.log('✅ Absensi berhasil disimpan!')
    setStep('success')
    setSubmitting(false)
  }

  // LOADING
  if (step === 'loading') return (
    <div className="min-h-screen bg-[#080d17] flex items-center justify-center">
      <div className="text-[#C9A84C] text-sm animate-pulse tracking-widest uppercase">Memverifikasi...</div>
    </div>
  )

  // ERROR
  if (step === 'error') return (
    <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-2xl">✕</span>
        </div>
        <h2 className="text-lg font-semibold mb-3 text-[#F5F0E8]">Tidak Dapat Absen</h2>
        <p className="text-[#F5F0E8]/50 text-sm leading-relaxed">{errorMsg}</p>
      </div>
    </div>
  )

  // GPS LOADING
  if (step === 'gps') return (
    <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-2xl">📍</span>
        </div>
        <h2 className="text-lg font-semibold mb-3 text-[#F5F0E8]">Memverifikasi Lokasi</h2>
        <p className="text-[#F5F0E8]/50 text-sm">Izinkan akses lokasi saat browser meminta. GPS wajib diaktifkan.</p>
      </div>
    </div>
  )

  // SUCCESS
  if (step === 'success') return (
    <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-green-400 text-2xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold mb-2 text-[#F5F0E8]">Absensi Berhasil!</h2>
        <p className="text-[#F5F0E8]/50 text-sm mb-2">
          Selamat datang, <span className="text-[#C9A84C] font-medium">{form.name}</span>!
        </p>
        <p className="text-[#F5F0E8]/30 text-xs">{session?.title}</p>
      </div>
    </div>
  )

  // FORM
  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8] px-6 py-10">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 mb-4">
            <span className="text-[#C9A84C] text-lg font-bold">UK3</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs mb-3">
            ● Lokasi Terverifikasi
          </div>
          <h1 className="text-xl font-bold mb-1">{session?.title}</h1>
          <p className="text-[#F5F0E8]/40 text-sm">
            {session && new Date(session.date).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
          </p>
          {location && (
            <p className="text-[#F5F0E8]/30 text-xs mt-1">📍 {location.name}</p>
          )}
        </div>

        {/* Form */}
        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
                placeholder="Nama kamu"
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
            </div>

            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">NIM</label>
              <input
                type="text"
                value={form.nim}
                onChange={handleNIMChange}  // ✅ Auto-fill angkatan
                required
                placeholder="Contoh: 230411100073"
                maxLength={12}
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
            </div>

            {/* ✅ Angkatan - Auto-filled dari NIM (bisa diedit jika perlu) */}
            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Angkatan</label>
              <input
                type="text"
                value={form.angkatan}
                onChange={e => setForm({...form, angkatan: e.target.value})}
                required
                placeholder="Otomatis dari NIM (Contoh: 2023)"
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
              <p className="text-[#F5F0E8]/30 text-xs mt-1">
                💡 Diisi otomatis dari 2 angka pertama NIM
              </p>
            </div>

            {/* ✅ Field Baru: Nama Kakak Bimbing */}
            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Nama Kakak Bimbing</label>
              <input
                type="text"
                value={form.kakak_bimbing}
                onChange={e => setForm({...form, kakak_bimbing: e.target.value})}
                required
                placeholder="Nama kakak pembimbing kamu"
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />
            </div>

            {/* Tanda Tangan */}
            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Tanda Tangan</label>
              <div className="border border-[#C9A84C]/20 rounded-xl overflow-hidden bg-white">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{ width: 400, height: 150, className: 'w-full' }}
                  backgroundColor="white"
                  penColor="black"
                />
              </div>
              <button
                type="button"
                onClick={() => sigRef.current.clear()}
                className="mt-2 text-xs text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60 transition-colors"
              >
                Hapus tanda tangan
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl hover:bg-[#D4B483] disabled:opacity-50 transition-all text-sm"
            >
              {submitting ? 'Menyimpan...' : 'Kirim Absensi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}