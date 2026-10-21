import { BookOpen, HandHeart, Images, Megaphone, Users } from 'lucide-react'

// Menu publik: dipakai navbar, footer, dan akses cepat di beranda
// supaya nama dan penjelasannya selalu seragam.
export const PUBLIC_NAV = [
  { to: '/pengumuman', label: 'Pengumuman', desc: 'Info dan kegiatan terbaru', icon: Megaphone },
  { to: '/renungan', label: 'Renungan', desc: 'Firman untuk dibaca dan direnungkan', icon: BookOpen },
  { to: '/kepengurusan', label: 'Kepengurusan', desc: 'Struktur dan wajah para pengurus', icon: Users },
  { to: '/galeri', label: 'Galeri', desc: 'Foto momen kebersamaan', icon: Images },
  { to: '/layanan', label: 'Layanan', desc: 'Konseling, doa, dan pelayanan lain', icon: HandHeart },
]
