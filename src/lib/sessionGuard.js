// Batas waktu sesi pengurus. Supabase menyimpan login di browser dan memperbaruinya otomatis,
// sehingga tanpa batas ini sesi bisa bertahan berhari-hari di HP/komputer yang sama.
// Dua batas berlaku bersamaan: tidak aktif terlalu lama, dan umur maksimal sejak masuk.
export const IDLE_LIMIT_MS = 60 * 60 * 1000 // 1 jam tanpa aktivitas
export const MAX_SESSION_MS = 12 * 60 * 60 * 1000 // 12 jam sejak masuk
export const NOTICE_KEY = 'uk3.auth.notice'

const LOGIN_AT = 'uk3.auth.loginAt'
const LAST_ACTIVE = 'uk3.auth.lastActive'
const WRITE_EVERY_MS = 15 * 1000

const read = (k) => {
  try { return Number(localStorage.getItem(k)) || 0 } catch { return 0 }
}
const write = (k, v) => {
  try { localStorage.setItem(k, String(v)) } catch { /* penyimpanan diblokir: sesi dianggap kedaluwarsa di cek berikutnya */ }
}

export function markLogin() {
  const now = Date.now()
  write(LOGIN_AT, now)
  write(LAST_ACTIVE, now)
}

export function clearStamps() {
  try {
    localStorage.removeItem(LOGIN_AT)
    localStorage.removeItem(LAST_ACTIVE)
  } catch { /* abaikan */ }
}

// Sesi tanpa stempel (misalnya login lama sebelum aturan ini ada) dianggap kedaluwarsa.
export function isExpired(now = Date.now()) {
  const loginAt = read(LOGIN_AT)
  const lastActive = read(LAST_ACTIVE)
  if (!loginAt || !lastActive) return true
  return now - loginAt > MAX_SESSION_MS || now - lastActive > IDLE_LIMIT_MS
}

// Catat aktivitas (dibatasi tiap 15 detik). Sesi yang sudah kedaluwarsa tidak diperpanjang.
let lastWrite = 0
export function touch() {
  const now = Date.now()
  if (now - lastWrite < WRITE_EVERY_MS) return
  if (isExpired(now)) return
  lastWrite = now
  write(LAST_ACTIVE, now)
}

export function setNotice(message) {
  try { sessionStorage.setItem(NOTICE_KEY, message) } catch { /* abaikan */ }
}
export function takeNotice() {
  try {
    const m = sessionStorage.getItem(NOTICE_KEY)
    if (m) sessionStorage.removeItem(NOTICE_KEY)
    return m ?? ''
  } catch {
    return ''
  }
}
