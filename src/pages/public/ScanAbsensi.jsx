import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { LogoMark } from '../../components/Logo'

const SIGNATURE_HEIGHT = 160

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('NO_GEO'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
  })
}

function geoErrorMessage(err) {
  if (err?.message === 'NO_GEO') return 'Browser kamu tidak mendukung GPS.'
  if (err?.code === 1) return 'Izin lokasi ditolak. GPS wajib diaktifkan untuk absensi.'
  if (err?.code === 3)
    return 'Lokasi tidak ditemukan tepat waktu. Pindah ke area terbuka, lalu muat ulang halaman.'
  return 'Lokasi tidak dapat ditentukan. Pastikan GPS aktif, lalu muat ulang halaman.'
}

// Ambil angkatan dari NIM (2 digit pertama)
function getAngkatan(nimVal) {
  return nimVal && nimVal.length >= 2 ? '20' + nimVal.substring(0, 2) : ''
}

// Hindari karakter wildcard LIKE dari input pengguna
function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&')
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tanpa-nama'
}

const labelClass = 'mb-2 block text-xs tracking-widest uppercase text-ink-500'
const inputBase =
  'w-full rounded-xl border px-4 py-3 text-sm text-ink-900 placeholder-ink-300 transition-colors focus:outline-none'
const inputEditable = `${inputBase} border-paper-300 bg-white focus:border-brand-500`
const inputLocked = `${inputBase} cursor-not-allowed border-green-300 bg-green-50`
const dropdownClass =
  'absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-paper-300 bg-white shadow-xl'
const optionClass =
  'w-full border-b border-paper-200 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-brand-50'

function CenteredScreen({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-100 px-6 text-ink-900">
      <div className="w-full max-w-sm text-center"><LogoMark size={56} className="mx-auto mb-6" />{children}</div>
    </main>
  )
}

function StatusIcon({ tone, children }) {
  const tones = {
    red: 'border-red-300 bg-red-50 text-red-700',
    green: 'border-green-300 bg-green-50 text-green-700',
    gold: 'border-brand-200 bg-brand-50 text-brand-700 animate-pulse',
  }
  return (
    <div
      aria-hidden="true"
      className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border text-2xl ${tones[tone]}`}
    >
      {children}
    </div>
  )
}

export default function ScanAbsensi() {
  const { token } = useParams()
  const sigRef = useRef(null)
  const sigWrapRef = useRef(null)

  const [step, setStep] = useState('loading')
  const [session, setSession] = useState(null)
  const [location, setLocation] = useState(null)
  const [gpsCoords, setGpsCoords] = useState(null)
  const [fingerprint, setFingerprint] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form
  const [nameQuery, setNameQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [nim, setNim] = useState('')
  const [nimLocked, setNimLocked] = useState(false)
  const [prodi, setProdi] = useState('')
  const [mentorQuery, setMentorQuery] = useState('')
  const [mentorSuggestions, setMentorSuggestions] = useState([])
  const [selectedMentor, setSelectedMentor] = useState('')
  const searchTimeout = useRef(null)
  const mentorTimeout = useRef(null)

  // Validasi sesi → perangkat → lokasi
  useEffect(() => {
    let cancelled = false

    function fail(message) {
      setErrorMsg(message)
      setStep('error')
    }

    async function init() {
      let visitorId
      try {
        const fp = await FingerprintJS.load()
        visitorId = (await fp.get()).visitorId
      } catch {
        if (!cancelled) fail('Perangkat tidak dapat diverifikasi. Nonaktifkan pemblokir skrip, lalu muat ulang halaman.')
        return
      }
      if (cancelled) return
      setFingerprint(visitorId)

      const { data, error } = await supabase
        .from('sessions')
        .select('*, locations(*)')
        .eq('token', token)
        .maybeSingle()
      if (cancelled) return

      if (error || !data) return fail('Sesi tidak ditemukan atau link tidak valid.')
      if (data.status === 'closed') return fail('Sesi ini sudah ditutup oleh panitia.')

      // Satu perangkat hanya boleh absen satu kali per sesi
      const { data: deviceExist } = await supabase
        .from('attendance_devices')
        .select('id, student_name')
        .eq('session_id', data.id)
        .eq('fingerprint', visitorId)
        .maybeSingle()
      if (cancelled) return

      if (deviceExist) {
        return fail(
          `Perangkat ini sudah digunakan untuk absen atas nama "${deviceExist.student_name}" di sesi ini. Satu perangkat hanya bisa absen satu kali.`,
        )
      }

      setSession(data)
      setLocation(data.locations)
      setStep('gps')

      let position
      try {
        position = await getPosition()
      } catch (err) {
        if (!cancelled) fail(geoErrorMessage(err))
        return
      }
      if (cancelled) return

      const { latitude, longitude } = position.coords
      setGpsCoords({ lat: latitude, lng: longitude })

      const loc = data.locations
      if (loc) {
        const dist = haversineDistance(latitude, longitude, loc.lat, loc.lng)
        if (dist > loc.radius_m) {
          return fail(
            `Kamu berada ${Math.round(dist)}m dari lokasi PD. Maksimal radius ${loc.radius_m}m. Pastikan kamu hadir langsung di tempat.`,
          )
        }
      }
      setStep('form')
    }

    init()
    return () => {
      cancelled = true
    }
  }, [token])

  // Samakan ukuran internal canvas dengan ukuran tampilan agar goresan tepat di bawah jari.
  useEffect(() => {
    if (step !== 'form') return

    function resize() {
      const canvas = sigRef.current?.getCanvas()
      const wrap = sigWrapRef.current
      if (!canvas || !wrap) return

      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const width = Math.floor(wrap.clientWidth * ratio)
      if (width === 0 || canvas.width === width) return

      canvas.width = width
      canvas.height = SIGNATURE_HEIGHT * ratio
      canvas.getContext('2d').scale(ratio, ratio)
      sigRef.current.clear()
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [step])

  // Autocomplete nama
  function handleNameChange(val) {
    setNameQuery(val)
    setSelectedStudent(null)
    setNim('')
    setNimLocked(false)
    setProdi('')
    setMentorQuery('')
    setSelectedMentor('')

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (val.length < 2) {
      setSuggestions([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .ilike('name', `%${escapeLike(val)}%`)
        .limit(8)
      setSuggestions(data ?? [])
    }, 300)
  }

  function handleMentorChange(val) {
    setMentorQuery(val)
    setSelectedMentor(val)
    if (mentorTimeout.current) clearTimeout(mentorTimeout.current)
    if (val.length < 1) {
      setMentorSuggestions([])
      return
    }

    const angkatanFromNim = getAngkatan(nim)

    mentorTimeout.current = setTimeout(async () => {
      let query = supabase.from('mentors').select('*').ilike('name', `%${escapeLike(val)}%`).limit(6)
      if (angkatanFromNim) query = query.eq('angkatan_bimbing', angkatanFromNim)
      const { data } = await query
      setMentorSuggestions(data ?? [])
    }, 300)
  }

  function selectStudent(student) {
    setSelectedStudent(student)
    setNameQuery(student.name)
    setSuggestions([])
    setProdi(student.prodi ?? '')

    if (student.nim) {
      setNim(student.nim)
      setNimLocked(true) // NIM sudah ada, kunci
    } else {
      setNim('')
      setNimLocked(false) // NIM belum ada, harus diisi
    }

    setMentorQuery(student.kakak_bimbing ?? '')
    setSelectedMentor(student.kakak_bimbing ?? '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setFormError('')

    const finalName = nameQuery.trim()
    const finalNim = nim.trim()
    const angkatan = getAngkatan(finalNim)

    if (!finalName) {
      setFormError('Nama lengkap wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      // Cek duplikat NIM di sesi ini
      if (finalNim) {
        const { data: existing } = await supabase
          .from('attendances')
          .select('id')
          .eq('session_id', session.id)
          .eq('nim', finalNim)
          .maybeSingle()

        if (existing) {
          setErrorMsg('NIM ini sudah melakukan absensi untuk sesi ini.')
          setStep('error')
          return
        }
      }

      // Simpan tanda tangan
      let signature_url = null
      if (sigRef.current && !sigRef.current.isEmpty()) {
        const dataUrl = sigRef.current.toDataURL('image/png')
        const blob = await (await fetch(dataUrl)).blob()
        const filename = `signatures/${session.id}/${finalNim || slugify(finalName)}.png`
        const { error: uploadErr } = await supabase.storage
          .from('uk3-media')
          .upload(filename, blob, { contentType: 'image/png', upsert: true })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('uk3-media').getPublicUrl(filename)
          signature_url = urlData.publicUrl
        }
      }

      // Lengkapi NIM di tabel students kalau belum ada
      if (selectedStudent && !selectedStudent.nim && finalNim) {
        await supabase.from('students').update({ nim: finalNim, angkatan }).eq('id', selectedStudent.id)
      }

      // Simpan absensi
      const { error } = await supabase.from('attendances').insert({
        session_id: session.id,
        name: finalName,
        nim: finalNim,
        angkatan,
        prodi,
        kakak_bimbing: selectedMentor || selectedStudent?.kakak_bimbing || '',
        signature_url,
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng,
      })
      if (error) throw error

      // Catat perangkat
      await supabase.from('attendance_devices').insert({
        session_id: session.id,
        fingerprint,
        student_name: finalName,
      })

      setStep('success')
    } catch (err) {
      console.error(err)
      setFormError(`Gagal menyimpan absensi. ${err?.message ?? 'Silakan coba lagi.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- UI per langkah ----------

  if (step === 'loading')
    return (
      <CenteredScreen>
        <div role="status" className="animate-pulse text-sm tracking-widest uppercase text-brand-700">
          Memverifikasi...
        </div>
      </CenteredScreen>
    )

  if (step === 'error')
    return (
      <CenteredScreen>
        <StatusIcon tone="red">✕</StatusIcon>
        <h1 className="mb-3 text-lg font-semibold">Tidak Dapat Absen</h1>
        <p role="alert" className="text-sm leading-relaxed text-ink-500">
          {errorMsg}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 rounded-full border border-brand-300 px-6 py-2 text-xs text-brand-700 transition-colors hover:bg-brand-50"
        >
          Muat ulang
        </button>
      </CenteredScreen>
    )

  if (step === 'gps')
    return (
      <CenteredScreen>
        <StatusIcon tone="gold">
          <MapPin size={28} />
        </StatusIcon>
        <h1 className="mb-3 text-lg font-semibold">Memverifikasi Lokasi</h1>
        <p role="status" className="text-sm text-ink-500">
          Izinkan akses lokasi saat browser meminta.
        </p>
      </CenteredScreen>
    )

  if (step === 'success')
    return (
      <CenteredScreen>
        <StatusIcon tone="green">✓</StatusIcon>
        <h1 className="mb-2 text-lg font-semibold">Absensi Berhasil!</h1>
        <p className="mb-1 text-sm text-ink-500">
          Selamat datang, <span className="font-medium text-brand-700">{nameQuery}</span>!
        </p>
        <p className="text-xs text-ink-400">{session?.title}</p>
      </CenteredScreen>
    )

  const hasMentorFromData = !!selectedStudent?.kakak_bimbing

  return (
    <main className="min-h-screen bg-paper-100 px-5 py-10 text-ink-900 sm:px-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src="/logo-uk3.png" alt="Logo UK3 UTM" width="64" height="64" className="mx-auto mb-4 h-16 w-16 object-contain" />
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs text-green-700">
            ● Lokasi Terverifikasi
          </div>
          <h1 className="mb-1 text-xl font-bold">{session?.title}</h1>
          <p className="text-sm text-ink-500">
            {session && formatDate(session.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
              <MapPin size={12} aria-hidden="true" /> {location.name}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-paper-300 bg-white p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Nama dengan autocomplete */}
            <div className="relative">
              <label htmlFor="absen-nama" className={labelClass}>
                Nama Lengkap
              </label>
              <input
                id="absen-nama"
                type="text"
                value={nameQuery}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoComplete="off"
                placeholder="Ketik nama kamu..."
                className={inputEditable}
              />

              {suggestions.length > 0 && (
                <div className={dropdownClass}>
                  {suggestions.map((s) => (
                    <button key={s.id} type="button" onClick={() => selectStudent(s)} className={optionClass}>
                      <div className="font-medium">{s.name}</div>
                      <div className="mt-0.5 text-xs text-ink-400">
                        {s.nim ? `NIM: ${s.nim}` : 'NIM belum terdaftar'}
                        {s.prodi && ` · ${s.prodi}`}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestions([])
                      setSelectedStudent(null)
                    }}
                    className="w-full px-4 py-3 text-left text-xs text-ink-400 transition-colors hover:bg-paper-100"
                  >
                    Nama saya tidak ada dalam daftar →
                  </button>
                </div>
              )}
            </div>

            {/* NIM */}
            <div>
              <label htmlFor="absen-nim" className={labelClass}>
                NIM {nimLocked && <span className="normal-case text-green-700">✓ Terverifikasi</span>}
              </label>
              <input
                id="absen-nim"
                type="text"
                inputMode="numeric"
                value={nim}
                onChange={(e) => !nimLocked && setNim(e.target.value)}
                readOnly={nimLocked}
                required
                autoComplete="off"
                placeholder={nimLocked ? '' : 'Masukkan NIM kamu'}
                className={nimLocked ? inputLocked : inputEditable}
              />
              {nim.length >= 2 && <div className="mt-1 text-xs text-brand-700">Angkatan: {getAngkatan(nim)}</div>}
            </div>

            {/* Prodi — hanya tampil kalau dari data */}
            {prodi && (
              <div>
                <span className={labelClass}>Program Studi</span>
                <div className="rounded-xl border border-paper-200 bg-white px-4 py-3 text-sm text-ink-500">
                  {prodi}
                </div>
              </div>
            )}

            {/* Kakak Bimbing */}
            <div className="relative">
              <label htmlFor="absen-mentor" className={labelClass}>
                Kakak Bimbing
                {hasMentorFromData && <span className="ml-2 normal-case text-green-700">✓ Dari data</span>}
              </label>
              <input
                id="absen-mentor"
                type="text"
                value={mentorQuery}
                onChange={(e) => handleMentorChange(e.target.value)}
                readOnly={hasMentorFromData}
                autoComplete="off"
                placeholder={
                  nim.length >= 2 ? `Kakak bimbing angkatan ${getAngkatan(nim)}...` : 'Ketik nama kakak bimbing...'
                }
                className={hasMentorFromData ? inputLocked : inputEditable}
              />

              {mentorSuggestions.length > 0 && !hasMentorFromData && (
                <div className={dropdownClass}>
                  {mentorSuggestions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMentorQuery(m.name)
                        setSelectedMentor(m.name)
                        setMentorSuggestions([])
                      }}
                      className={optionClass}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-ink-400">
                        Kakak bimbing angkatan {m.angkatan_bimbing}
                        {m.prodi && ` · ${m.prodi}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {nim.length >= 2 && !mentorQuery && (
                <div className="mt-1 text-xs text-ink-400">Menampilkan kakak bimbing angkatan {getAngkatan(nim)}</div>
              )}
            </div>

            {/* Tanda Tangan */}
            <div>
              <span className={labelClass}>Tanda Tangan</span>
              <div ref={sigWrapRef} className="overflow-hidden rounded-xl border border-paper-300 bg-white">
                <SignatureCanvas
                  ref={sigRef}
                  canvasProps={{
                    className: 'block w-full touch-none',
                    style: { height: SIGNATURE_HEIGHT },
                    'aria-label': 'Area tanda tangan',
                  }}
                  backgroundColor="white"
                  penColor="black"
                />
              </div>
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="mt-2 text-xs text-ink-400 transition-colors hover:text-ink-900"
              >
                Hapus tanda tangan
              </button>
            </div>

            {formError && (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gold-400 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-gold-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Kirim Absensi'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
