# UK3 UTM

Situs resmi **Unit Kegiatan Kerohanian Kristen (UK3) Universitas Trunojoyo Madura** — Persekutuan Doa Revive.
Live: <https://uk3utm.vercel.app>

## Fitur

**Publik**
- Beranda (hero berlogo, akses cepat, pengumuman, renungan, visi/misi, BPH, album, tautan)
- Pengumuman, Renungan, Kepengurusan (bagan struktur), Album (galeri + lightbox), Layanan (QRIS, formulir, WhatsApp)
- Absensi lewat QR (`/scan/:token`) tanpa login: verifikasi GPS, satu perangkat satu absen, tanda tangan digital

**Panel admin** (`/admin`, login Supabase, akses menurut role `bph`, `infokom`, `pembinaan`)
- Sidebar sesuai role, dashboard dengan pengingat (mis. belum ada Ketua, visi kosong)
- Kepengurusan: form bertahap (pilih posisi, jabatan, divisi), pratinjau langsung, validasi (Ketua ganda, Kepala Departemen ganda), urutan otomatis
- Konten: pengumuman, renungan, layanan, album (unggah banyak foto), Beranda & Tautan (tentang, visi, misi, link)
- Pembinaan: sesi + QR, lokasi (peta), mahasiswa (impor Excel), kakak bimbing, rekap absensi (PDF)

## Desain

Palet ungu-emas-krem dari logo UK3 (`public/logo-uk3.png`). Token ada di `tailwind.config.js` (`brand`, `gold`, `paper`, `ink`); font Plus Jakarta Sans dan Cormorant Garamond (self-hosted via `@fontsource`).

## Struktur kode

- `src/lib/committee.js` aturan struktur pengurus (urutan, validasi) — satu sumber untuk publik dan admin
- `src/lib/adminNav.js` / `nav.js` definisi menu
- `src/components/ui/` komponen dasar (Button, Field, Modal, Avatar, ImageUpload)
- `src/context/UIProvider.jsx` toast dan dialog konfirmasi

## Supaya Supabase tidak pause

Paket gratis Supabase di-pause bila 7 hari tanpa aktivitas. Workflow `.github/workflows/keepalive-supabase.yml` mengirim satu permintaan baca tiap 3 hari. Setup sekali: di GitHub buka *Settings → Secrets and variables → Actions*, tambahkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` (isinya sama dengan `.env`), lalu jalankan manual sekali dari tab *Actions → Keepalive Supabase → Run workflow* untuk memastikan hasilnya hijau. GitHub menonaktifkan jadwal otomatis jika repo tidak ada aktivitas 60 hari; aktifkan kembali dari tab Actions bila itu terjadi.

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
