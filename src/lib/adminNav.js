import {
  BookOpen, CalendarCheck, GraduationCap, HandHeart, Images, LayoutDashboard,
  Megaphone, MapPin, Share2, UserCheck, Users,
} from 'lucide-react'

export const ROLES = {
  ALL: ['bph', 'infokom', 'pembinaan'],
  INFOKOM: ['bph', 'infokom'],
  PEMBINAAN: ['bph', 'pembinaan'],
}

export const ROLE_LABEL = { bph: 'BPH', infokom: 'Infokom', pembinaan: 'Pembinaan', viewer: 'Viewer' }

// Satu definisi menu untuk sidebar, dashboard, dan penjaga rute.
export const ADMIN_GROUPS = [
  {
    label: 'Ringkasan',
    items: [{ to: '/admin', label: 'Dashboard', desc: 'Ringkasan dan tugas hari ini', icon: LayoutDashboard, roles: ROLES.ALL, end: true }],
  },
  {
    label: 'Konten Website',
    items: [
      { to: '/admin/pengumuman', label: 'Pengumuman', desc: 'Info dan kegiatan di website', icon: Megaphone, roles: ROLES.INFOKOM },
      { to: '/admin/renungan', label: 'Renungan', desc: 'Renungan harian dan ayat', icon: BookOpen, roles: ROLES.INFOKOM },
      { to: '/admin/kepengurusan', label: 'Kepengurusan', desc: 'Susunan pengurus dan fotonya', icon: Users, roles: ROLES.INFOKOM },
      { to: '/admin/layanan', label: 'Layanan', desc: 'Layanan, kontak, dan QRIS', icon: HandHeart, roles: ROLES.INFOKOM },
      { to: '/admin/galeri', label: 'Galeri', desc: 'Foto kegiatan untuk galeri', icon: Images, roles: ROLES.INFOKOM },
      { to: '/admin/tautan', label: 'Sosmed & Tautan', desc: 'Instagram, YouTube, WhatsApp, dll.', icon: Share2, roles: ROLES.INFOKOM },
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
]

export const ABSENSI_ROUTE = { path: '/admin/absensi/:sessionId', roles: ROLES.PEMBINAAN }
