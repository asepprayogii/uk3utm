import {
  BookOpen, CalendarCheck, GraduationCap, HandHeart, Images, LayoutDashboard,
  Info, Megaphone, MapPin, Share2, ShieldCheck, UserCheck, Users,
} from 'lucide-react'

// Pembagian peran:
//  - BPH: semuanya.
//  - Penatalayanan: seluruh konten website (tanpa bagian Pembinaan).
//  - Pembinaan: bagian Pembinaan + Pengumuman + layanannya sendiri.
//  - Dopiper: Pengumuman, Renungan, dan layanannya sendiri.
//  - Mikat: Pengumuman dan layanannya sendiri.
export const ROLES = {
  ALL: ['bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'],
  KONTEN: ['bph', 'penatalayanan'],
  PENGUMUMAN: ['bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'],
  RENUNGAN: ['bph', 'penatalayanan', 'dopiper'],
  LAYANAN: ['bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'],
  PEMBINAAN: ['bph', 'pembinaan'],
  BPH: ['bph'],
}

export const ROLE_LABEL = { bph: 'BPH', penatalayanan: 'Penatalayanan', pembinaan: 'Pembinaan', dopiper: 'Dopiper', mikat: 'Mikat', viewer: 'Pengunjung' }

// Peran yang boleh mengelola semua konten (tidak dibatasi per pemilik).
export const FULL_ACCESS = ['bph', 'penatalayanan']
// Departemen yang punya layanan sendiri.
export const SERVICE_OWNERS = ['pembinaan', 'dopiper', 'mikat']

// Nama lama 'infokom' sama dengan 'penatalayanan'.
export const normalizeRole = (role) => (role === 'infokom' ? 'penatalayanan' : role)

// Satu definisi menu untuk sidebar, dashboard, dan penjaga rute.
export const ADMIN_GROUPS = [
  {
    label: 'Ringkasan',
    items: [{ to: '/admin', label: 'Dashboard', desc: 'Ringkasan dan tugas hari ini', icon: LayoutDashboard, roles: ROLES.ALL, end: true }],
  },
  {
    label: 'Konten',
    items: [
      { to: '/admin/tentang', label: 'Tentang UK3', desc: 'Sejarah, tahun berdiri, dan kegiatan', icon: Info, roles: ROLES.KONTEN },
      { to: '/admin/pengumuman', label: 'Pengumuman', desc: 'Info dan kegiatan di website', icon: Megaphone, roles: ROLES.PENGUMUMAN },
      { to: '/admin/renungan', label: 'Renungan', desc: 'Renungan harian dan ayat', icon: BookOpen, roles: ROLES.RENUNGAN },
      { to: '/admin/kepengurusan', label: 'Kepengurusan', desc: 'Susunan pengurus dan fotonya', icon: Users, roles: ROLES.KONTEN },
      { to: '/admin/layanan', label: 'Layanan', desc: 'Layanan, kontak, dan QRIS', icon: HandHeart, roles: ROLES.LAYANAN },
      { to: '/admin/galeri', label: 'Galeri', desc: 'Foto kegiatan untuk galeri', icon: Images, roles: ROLES.KONTEN },
      { to: '/admin/tautan', label: 'Sosmed & Tautan', desc: 'Instagram, YouTube, WhatsApp, dll.', icon: Share2, roles: ROLES.KONTEN },
    ],
  },
  {
    label: 'Pembinaan',
    items: [
      { to: '/admin/sesi', label: 'Sesi Absensi', desc: 'Buat sesi dan QR absensi', icon: CalendarCheck, roles: ROLES.PEMBINAAN },
      { to: '/admin/mahasiswa', label: 'Mahasiswa', desc: 'Daftar mahasiswa binaan', icon: GraduationCap, roles: ROLES.PEMBINAAN },
      { to: '/admin/kakak-bimbing', label: 'Kakak Bimbing', desc: 'Daftar kakak bimbing', icon: UserCheck, roles: ROLES.PEMBINAAN },
      { to: '/admin/lokasi', label: 'Lokasi Absensi', desc: 'Titik lokasi dan radius', icon: MapPin, roles: ROLES.PEMBINAAN },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { to: '/admin/akun', label: 'Akun', desc: 'Kelola akun login dan perannya', icon: ShieldCheck, roles: ROLES.BPH },
    ],
  },
]

export const ABSENSI_ROUTE = { path: '/admin/absensi/:sessionId', roles: ROLES.PEMBINAAN }
