/** Mengubah galat teknis Supabase menjadi kalimat yang bisa ditindaklanjuti pengurus. */
export function friendlyError(err, action = 'menyimpan') {
  const msg = err?.message ?? String(err)
  if (/row-level security|permission denied/i.test(msg)) {
    return `Gagal ${action}: akun ini belum diberi izin di database. Minta admin teknis menjalankan file supabase/izin-tautan-dan-galeri.sql di Supabase (SQL Editor), atau pastikan peran akun adalah BPH/Infokom.`
  }
  return `Gagal ${action}: ${msg}`
}
