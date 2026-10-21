# UK3 UTM

Situs resmi **Unit Kegiatan Kerohanian Kristen (UK3) Universitas Trunojoyo Madura** — Persekutuan Doa Revive.
Live: <https://uk3utm.vercel.app>

## Fitur

**Publik**
- Beranda, Pengumuman, Renungan, Kepengurusan, Album Kegiatan, dan Layanan (QRIS, formulir, kontak WhatsApp)
- Absensi lewat QR (`/scan/:token`) tanpa login: verifikasi lokasi GPS, satu perangkat satu absen, tanda tangan digital

**Panel admin** (`/admin`, login Supabase, akses berdasarkan role `bph`, `infokom`, `pembinaan`)
- Kelola pengumuman, renungan, kepengurusan, layanan, dan album
- Kelola sesi, lokasi, mahasiswa, kakak bimbing, dan rekap absensi (ekspor PDF/Excel)

## Teknologi

React 19 · Vite · React Router · Tailwind CSS 3 · Supabase (Auth, Postgres, Storage, Realtime) · Leaflet · Vercel

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env   # lalu isi nilai dari dashboard Supabase
npm run dev
```

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Pratinjau hasil build |
| `npm run lint` | Cek kode dengan ESLint |

## Environment variable

| Nama | Keterangan |
| --- | --- |
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Publishable/anon key Supabase |

File `.env` tidak boleh di-commit. Key ini memang bersifat publik di sisi browser, jadi keamanan data
bergantung pada **Row Level Security (RLS)** di Supabase. Pastikan RLS aktif di semua tabel.

## Deploy

Deploy otomatis ke Vercel. `vercel.json` mengarahkan semua rute ke `index.html` agar React Router berfungsi.
Isi kedua environment variable di atas pada pengaturan project Vercel.

## Struktur

```
src/
  components/   Navbar, Footer, PageLayout, PageHeader, States, ProtectedRoute
  context/      AuthProvider (sesi & profil pengurus)
  hooks/        useAuth, useAsyncData
  lib/          supabase client, helper format
  pages/
    public/     Halaman publik + absensi
    admin/      Halaman panel admin
```
