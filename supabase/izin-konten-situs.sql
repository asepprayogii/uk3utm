-- Izin menulis teks situs (halaman Tentang, pilihan foto beranda) untuk BPH dan Infokom.
-- Aman dijalankan berulang. Jalankan di Supabase > SQL Editor.
-- Bila tabel site_content Anda sudah punya izin tulis yang berfungsi, file ini tidak merusaknya (hanya menambah).

alter table public.site_content enable row level security;

drop policy if exists site_content_baca_semua on public.site_content;
create policy site_content_baca_semua on public.site_content
  for select using (true);

drop policy if exists site_content_tulis_pengurus on public.site_content;
create policy site_content_tulis_pengurus on public.site_content
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('bph', 'infokom')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('bph', 'infokom')));
