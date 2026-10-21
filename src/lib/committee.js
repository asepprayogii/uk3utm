// Satu-satunya sumber aturan struktur kepengurusan.
// Dipakai oleh halaman publik, halaman admin, dan pratinjau di form.

export const FIXED_GROUPS = ['Pembina', 'Pembimbing', 'BPH']

export const DEPARTMENTS = ['Pembinaan', 'Dopiper', 'Penatalayanan', 'Minat Bakat']

export const DIVISIONS = {
  Pembinaan: ['Kelompok Besar', 'Kelompok Kecil'],
  Dopiper: ['Doa', 'Penginjilan', 'Pemerhati'],
  Penatalayanan: ['Infokom', 'Inventaris'],
  'Minat Bakat': ['Creative Ministry', 'Musik', 'Olahraga'],
}

export const GROUP_LABELS = {
  Pembina: 'Pembina',
  Pembimbing: 'Pembimbing',
  BPH: 'Badan Pengurus Harian',
}

export const BPH_POSITIONS = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara']
export const DEPT_POSITIONS = ['Kepala Departemen', 'Koordinator Divisi', 'Anggota']
export const KADEP_POSITION = 'Kepala Departemen'

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5 }

/**
 * Urutan jabatan BPH. "Wakil Ketua" HARUS dicek sebelum "Ketua" karena
 * teksnya memuat kata "ketua" (bug versi lama: Wakil Ketua terbaca sebagai Ketua).
 * Angka romawi/angka di akhir (Sekretaris II) hanya mengurutkan di dalam jabatan yang sama.
 */
export function bphRank(position = '') {
  const p = String(position).toLowerCase().trim()

  let base = 140
  if (/wakil\s+ketua/.test(p)) base = 110
  else if (/\bketua\b/.test(p)) base = 100
  else if (/sekretaris/.test(p)) base = 120
  else if (/bendahara/.test(p)) base = 130

  const m = p.match(/\b(iii|ii|iv|i|v|\d)\s*$/)
  const sub = m ? (ROMAN[m[1]] ?? Number(m[1])) : 0
  return base + Math.min(sub, 9)
}

/** Nilai urut tersimpan di kolom order_index (integer). */
export function autoOrder(position, department, isKadep) {
  if (department === 'Pembina') return 0
  if (department === 'Pembimbing') return 10
  if (department === 'BPH') return bphRank(position)
  if (isKadep) return 200
  return 300
}

/** Kolom `level` di database: 1 = pimpinan, 2 = kadep, 3 = anggota. */
export function autoLevel(department, isKadep) {
  if (FIXED_GROUPS.includes(department)) return 1
  return isKadep ? 2 : 3
}

export function sortCommittee(list) {
  return [...list].sort((a, b) => {
    const oA = autoOrder(a.position, a.department, a.is_kadep)
    const oB = autoOrder(b.position, b.department, b.is_kadep)
    if (oA !== oB) return oA - oB
    return (a.name ?? '').localeCompare(b.name ?? '', 'id')
  })
}

/**
 * Susun data datar dari database menjadi struktur siap tampil.
 * Departemen/divisi yang tidak ada di daftar baku tetap ditampilkan
 * (sebelumnya data seperti itu hilang dari halaman publik).
 */
export function groupCommittee(list) {
  const sorted = sortCommittee(list)
  const pick = (g) => sorted.filter((m) => m.department === g)

  const knownDepts = DEPARTMENTS.filter((d) => sorted.some((m) => m.department === d))
  const extraDepts = [
    ...new Set(
      sorted
        .map((m) => m.department)
        .filter((d) => d && !FIXED_GROUPS.includes(d) && !DEPARTMENTS.includes(d)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'id'))

  const departments = [...knownDepts, ...extraDepts].map((name) => {
    const members = sorted.filter((m) => m.department === name)
    const kadep = members.filter((m) => m.is_kadep)
    const rest = members.filter((m) => !m.is_kadep)

    const baseDivs = DIVISIONS[name] ?? []
    const extraDivs = [...new Set(rest.map((m) => m.division).filter((d) => d && !baseDivs.includes(d)))]
    const divisions = [...baseDivs, ...extraDivs]
      .map((div) => ({ name: div, members: rest.filter((m) => m.division === div) }))
      .filter((d) => d.members.length > 0)

    return { name, kadep, divisions, others: rest.filter((m) => !m.division), total: members.length }
  })

  return { pembina: pick('Pembina'), pembimbing: pick('Pembimbing'), bph: pick('BPH'), departments }
}

/** Kategori form tambah pengurus -> nilai kolom `department`. */
export function categoryOf(department) {
  if (FIXED_GROUPS.includes(department)) return department
  return 'Departemen'
}

/**
 * Validasi sebelum simpan. `errors` memblokir penyimpanan, `warnings` hanya mengingatkan.
 * `committee` = data yang sudah ada, `editingId` = id yang sedang diedit (diabaikan dari pengecekan duplikat).
 */
export function validateMember(form, committee, editingId = null) {
  const errors = []
  const warnings = []
  const others = committee.filter((m) => m.id !== editingId)
  const name = form.name.trim()
  const position = form.position.trim()

  if (name.length < 2) errors.push('Nama lengkap wajib diisi.')
  if (!position) errors.push('Jabatan wajib dipilih atau diisi.')
  if (!form.department) errors.push('Pilih posisi pengurus dalam struktur.')

  if (form.department === 'BPH' && position) {
    const rank = bphRank(position)
    if (rank === 100) {
      const existing = others.find((m) => m.department === 'BPH' && bphRank(m.position) === 100)
      if (existing) errors.push(`BPH sudah punya Ketua: ${existing.name}. Ubah jabatan ${existing.name} lebih dulu.`)
    }
    if (rank === 110) {
      const existing = others.find((m) => m.department === 'BPH' && bphRank(m.position) === 110)
      if (existing) warnings.push(`Sudah ada Wakil Ketua: ${existing.name}. Gunakan "Wakil Ketua II" jika memang ada dua.`)
    }
  }

  const isDept = !FIXED_GROUPS.includes(form.department) && form.department
  if (isDept) {
    if (form.is_kadep) {
      const existing = others.find((m) => m.department === form.department && m.is_kadep)
      if (existing) {
        errors.push(`Departemen ${form.department} sudah punya Kepala: ${existing.name}. Ubah data ${existing.name} lebih dulu.`)
      }
    } else if (!form.division) {
      warnings.push('Divisi belum dipilih. Anggota akan tampil di bagian "Anggota lainnya".')
    }
  }

  if (
    name &&
    others.some((m) => m.department === form.department && (m.name ?? '').trim().toLowerCase() === name.toLowerCase())
  ) {
    warnings.push(`"${name}" sudah terdaftar di ${form.department}. Pastikan ini bukan data ganda.`)
  }

  return { errors, warnings }
}

/** Kelengkapan struktur, untuk pengingat di dashboard dan halaman admin. */
export function structureIssues(list) {
  const issues = []
  if (list.length === 0) return ['Belum ada data pengurus.']
  if (!list.some((m) => m.department === 'BPH' && bphRank(m.position) === 100)) issues.push('Belum ada Ketua di BPH.')
  if (!list.some((m) => m.department === 'BPH' && bphRank(m.position) >= 120 && bphRank(m.position) < 130))
    issues.push('Belum ada Sekretaris.')
  if (!list.some((m) => m.department === 'BPH' && bphRank(m.position) >= 130 && bphRank(m.position) < 140))
    issues.push('Belum ada Bendahara.')

  for (const d of DEPARTMENTS) {
    const members = list.filter((m) => m.department === d)
    if (members.length > 0 && !members.some((m) => m.is_kadep)) issues.push(`Departemen ${d} belum punya Kepala.`)
  }
  const noPhoto = list.filter((m) => !m.photo_url).length
  if (noPhoto > 0) issues.push(`${noPhoto} pengurus belum punya foto.`)
  return issues
}
