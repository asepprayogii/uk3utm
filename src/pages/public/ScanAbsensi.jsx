import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import SignatureCanvas from "react-signature-canvas";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ScanAbsensi() {
  const { token } = useParams();
  const sigRef = useRef();

  const [step, setStep] = useState("loading");
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [nameQuery, setNameQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [nim, setNim] = useState("");
  const [nimLocked, setNimLocked] = useState(false);
  const [prodi, setProdi] = useState("");
  const [mentorQuery, setMentorQuery] = useState("");
  const [mentorSuggestions, setMentorSuggestions] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const searchTimeout = useRef(null);
  const mentorTimeout = useRef(null);

  useEffect(() => {
    init();
  }, [token]);

  async function init() {
    // Load fingerprint
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    setFingerprint(result.visitorId);

    // Validate token
    const { data, error } = await supabase.from("sessions").select("*, locations(*)").eq("token", token).maybeSingle();

    if (error || !data) {
      setErrorMsg("Sesi tidak ditemukan atau link tidak valid.");
      setStep("error");
      return;
    }

    if (data.status === "closed") {
      setErrorMsg("Sesi ini sudah ditutup oleh panitia.");
      setStep("error");
      return;
    }

    // Cek device fingerprint — apakah sudah absen di sesi ini
    const { data: deviceExist } = await supabase.from("attendance_devices").select("id, student_name").eq("session_id", data.id).eq("fingerprint", result.visitorId).maybeSingle();

    if (deviceExist) {
      setErrorMsg(`Perangkat ini sudah digunakan untuk absen atas nama "${deviceExist.student_name}" di sesi ini. Satu perangkat hanya bisa absen satu kali.`);
      setStep("error");
      return;
    }

    setSession(data);
    setLocation(data.locations);
    setStep("gps");
    requestGPS(data.locations, data);
  }

  function requestGPS(loc, sess) {
    if (!navigator.geolocation) {
      setErrorMsg("Browser kamu tidak mendukung GPS.");
      setStep("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });

        if (loc) {
          const dist = haversineDistance(latitude, longitude, loc.lat, loc.lng);
          if (dist > loc.radius_m) {
            setErrorMsg(`Kamu berada ${Math.round(dist)}m dari lokasi PD. Maksimal radius ${loc.radius_m}m. Pastikan kamu hadir langsung di tempat.`);
            setStep("error");
            return;
          }
        }
        setStep("form");
      },
      () => {
        setErrorMsg("Izin lokasi ditolak. GPS wajib diaktifkan untuk absensi.");
        setStep("error");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  // Autocomplete nama
  async function handleNameChange(val) {
    setNameQuery(val);
    setSelectedStudent(null);
    setNim("");
    setNimLocked(false);
    setProdi("");
    setMentorQuery("");
    setSelectedMentor("");

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase.from("students").select("*").ilike("name", `%${val}%`).limit(8);
      setSuggestions(data ?? []);
    }, 300);
  }

  async function handleMentorChange(val) {
    setMentorQuery(val);
    setSelectedMentor(val);
    if (mentorTimeout.current) clearTimeout(mentorTimeout.current);
    if (val.length < 1) {
      setMentorSuggestions([]);
      return;
    }

    const angkatanFromNim = getAngkatan(nim);

    mentorTimeout.current = setTimeout(async () => {
      let query = supabase.from("mentors").select("*").ilike("name", `%${val}%`).limit(6);

      if (angkatanFromNim) {
        query = query.eq("angkatan_bimbing", angkatanFromNim);
      }

      const { data } = await query;
      setMentorSuggestions(data ?? []);
    }, 300);
  }

  function selectStudent(student) {
    setSelectedStudent(student);
    setNameQuery(student.name);
    setSuggestions([]);
    setProdi(student.prodi ?? "");
    if (student.nim) {
      setNim(student.nim);
      setNimLocked(true); // NIM sudah ada, kunci
    } else {
      setNim("");
      setNimLocked(false); // NIM belum ada, harus isi
    }
    if (student.kakak_bimbing) {
      setMentorQuery(student.kakak_bimbing);
      setSelectedMentor(student.kakak_bimbing);
    } else {
      setMentorQuery("");
      setSelectedMentor("");
    }
  }

  // Ambil angkatan dari NIM
  function getAngkatan(nimVal) {
    if (nimVal && nimVal.length >= 2) {
      return "20" + nimVal.substring(0, 2);
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const finalName = nameQuery.trim();
    const finalNim = nim.trim();
    const angkatan = getAngkatan(finalNim);

    if (!finalName) {
      setSubmitting(false);
      return;
    }

    // Cek duplikat NIM di sesi ini
    if (finalNim) {
      const { data: existing } = await supabase.from("attendances").select("id").eq("session_id", session.id).eq("nim", finalNim).maybeSingle();

      if (existing) {
        setErrorMsg("NIM ini sudah melakukan absensi untuk sesi ini.");
        setStep("error");
        return;
      }
    }

    // Simpan tanda tangan
    let signature_url = null;
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const filename = `signatures/${session.id}/${finalNim || finalName}.png`;
      const { error: uploadErr } = await supabase.storage.from("uk3-media").upload(filename, blob, { contentType: "image/png", upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("uk3-media").getPublicUrl(filename);
        signature_url = urlData.publicUrl;
      }
    }

    // Update NIM di tabel students kalau belum ada
    if (selectedStudent && !selectedStudent.nim && finalNim) {
      await supabase.from("students").update({ nim: finalNim, angkatan }).eq("id", selectedStudent.id);
    }

    // Simpan absensi
    const { error } = await supabase.from("attendances").insert({
      session_id: session.id,
      name: finalName,
      nim: finalNim,
      angkatan,
      prodi,
      kakak_bimbing: selectedMentor || selectedStudent?.kakak_bimbing || "",
      signature_url,
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
    });

    if (error) {
      setErrorMsg("Gagal menyimpan absensi. " + error.message);
      setStep("error");
      return;
    }

    // Simpan device fingerprint
    await supabase.from("attendance_devices").insert({
      session_id: session.id,
      fingerprint,
      student_name: finalName,
    });

    setStep("success");
    setSubmitting(false);
  }

  // UI States
  if (step === "loading")
    return (
      <div className="min-h-screen bg-[#080d17] flex items-center justify-center">
        <div className="text-[#C9A84C] text-sm animate-pulse tracking-widest uppercase">Memverifikasi...</div>
      </div>
    );

  if (step === "error")
    return (
      <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-2xl">✕</span>
          </div>
          <h2 className="text-lg font-semibold mb-3">Tidak Dapat Absen</h2>
          <p className="text-[#F5F0E8]/50 text-sm leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );

  if (step === "gps")
    return (
      <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-2xl">📍</span>
          </div>
          <h2 className="text-lg font-semibold mb-3">Memverifikasi Lokasi</h2>
          <p className="text-[#F5F0E8]/50 text-sm">Izinkan akses lokasi saat browser meminta.</p>
        </div>
      </div>
    );

  if (step === "success")
    return (
      <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold mb-2">Absensi Berhasil!</h2>
          <p className="text-[#F5F0E8]/50 text-sm mb-1">
            Selamat datang, <span className="text-[#C9A84C] font-medium">{nameQuery}</span>!
          </p>
          <p className="text-[#F5F0E8]/30 text-xs">{session?.title}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8] px-6 py-10">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 mb-4">
            <span className="text-[#C9A84C] text-lg font-bold">UK3</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs mb-3 ml-2">● Lokasi Terverifikasi</div>
          <h1 className="text-xl font-bold mb-1">{session?.title}</h1>
          <p className="text-[#F5F0E8]/40 text-sm">{session && new Date(session.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          {location && <p className="text-[#F5F0E8]/30 text-xs mt-1">📍 {location.name}</p>}
        </div>

        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Nama dengan autocomplete */}
            <div className="relative">
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ketik nama kamu..."
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60"
              />

              {/* Dropdown suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl overflow-hidden shadow-xl">
                  {suggestions.map((s) => (
                    <button key={s.id} type="button" onClick={() => selectStudent(s)} className="w-full text-left px-4 py-3 text-sm hover:bg-[#C9A84C]/10 transition-colors border-b border-[#C9A84C]/10 last:border-0">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[#F5F0E8]/30 text-xs mt-0.5">
                        {s.nim ? `NIM: ${s.nim}` : "NIM belum terdaftar"}
                        {s.prodi && ` · ${s.prodi}`}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestions([]);
                      setSelectedStudent(null);
                    }}
                    className="w-full text-left px-4 py-3 text-xs text-[#F5F0E8]/30 hover:bg-[#F5F0E8]/5 transition-colors"
                  >
                    Nama saya tidak ada dalam daftar →
                  </button>
                </div>
              )}
            </div>

            {/* NIM */}
            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">NIM {nimLocked && <span className="text-green-400 normal-case">✓ Terverifikasi</span>}</label>
              <input
                type="text"
                value={nim}
                onChange={(e) => !nimLocked && setNim(e.target.value)}
                readOnly={nimLocked}
                required
                placeholder={nimLocked ? "" : "Masukkan NIM kamu"}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none transition-colors ${
                  nimLocked ? "bg-green-500/5 border-green-500/30 cursor-not-allowed" : "bg-[#0d1525] border-[#C9A84C]/20 focus:border-[#C9A84C]/60"
                }`}
              />
              {nim.length >= 2 && <div className="text-[#C9A84C] text-xs mt-1">Angkatan: {getAngkatan(nim)}</div>}
            </div>

            {/* Prodi — readonly kalau dari data */}
            {prodi && (
              <div>
                <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Program Studi</label>
                <div className="bg-[#0d1525] border border-[#C9A84C]/10 rounded-xl px-4 py-3 text-sm text-[#F5F0E8]/60">{prodi}</div>
              </div>
            )}

            {/* Kakak Bimbing */}
            <div className="relative">
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">
                Kakak Bimbing
                {selectedStudent?.kakak_bimbing && <span className="text-green-400 normal-case ml-2">✓ Dari data</span>}
              </label>
              <input
                type="text"
                value={mentorQuery}
                onChange={(e) => handleMentorChange(e.target.value)}
                readOnly={!!selectedStudent?.kakak_bimbing}
                placeholder={nim.length >= 2 ? `Kakak bimbing angkatan ${getAngkatan(nim)}...` : "Ketik nama kakak bimbing..."}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/20 focus:outline-none transition-colors ${
                  selectedStudent?.kakak_bimbing ? "bg-green-500/5 border-green-500/30 cursor-not-allowed" : "bg-[#0d1525] border-[#C9A84C]/20 focus:border-[#C9A84C]/60"
                }`}
              />

              {/* Dropdown kakak bimbing */}
              {mentorSuggestions.length > 0 && !selectedStudent?.kakak_bimbing && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl overflow-hidden shadow-xl">
                  {mentorSuggestions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMentorQuery(m.name);
                        setSelectedMentor(m.name);
                        setMentorSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-[#C9A84C]/10 transition-colors border-b border-[#C9A84C]/10 last:border-0"
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[#F5F0E8]/30 text-xs">
                        Kakak bimbing angkatan {m.angkatan_bimbing}
                        {m.prodi && ` · ${m.prodi}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {nim.length >= 2 && !mentorQuery && <div className="text-[#F5F0E8]/20 text-xs mt-1">Menampilkan kakak bimbing angkatan {getAngkatan(nim)}</div>}
            </div>

            {/* Tanda Tangan */}
            <div>
              <label className="text-xs text-[#F5F0E8]/40 tracking-widest uppercase block mb-2">Tanda Tangan</label>
              <div className="border border-[#C9A84C]/20 rounded-xl overflow-hidden bg-white">
                <SignatureCanvas ref={sigRef} canvasProps={{ width: 400, height: 150, className: "w-full" }} backgroundColor="white" penColor="black" />
              </div>
              <button type="button" onClick={() => sigRef.current.clear()} className="mt-2 text-xs text-[#F5F0E8]/30 hover:text-[#F5F0E8]/60 transition-colors">
                Hapus tanda tangan
              </button>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl hover:bg-[#D4B483] disabled:opacity-50 transition-all text-sm">
              {submitting ? "Menyimpan..." : "Kirim Absensi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
