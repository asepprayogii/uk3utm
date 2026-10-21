// Aturan sesi absensi. Zona waktu tetap WIB agar "hari ini" benar di mana pun perangkatnya.
const TZ = 'Asia/Jakarta'

/** Tanggal hari ini (WIB) dalam format YYYY-MM-DD, sama dengan kolom `date` di tabel sessions. */
export function todayWib(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: TZ })
}

/** Sesi berakhir otomatis setelah harinya lewat, walau panitia lupa menutupnya. */
export function isExpired(session, now = new Date()) {
  return !!session?.date && String(session.date).slice(0, 10) < todayWib(now)
}

/** Status yang ditampilkan: 'open' | 'closed' | 'expired'. */
export function sessionState(session, now = new Date()) {
  if (session.status === 'closed') return 'closed'
  return isExpired(session, now) ? 'expired' : 'open'
}
