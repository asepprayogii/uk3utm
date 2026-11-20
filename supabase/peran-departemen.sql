-- ============================================================================
-- Peran departemen UK3 UTM
--   bph            : semuanya
--   penatalayanan  : seluruh konten website (tanpa bagian Pembinaan)
--   pembinaan      : bagian Pembinaan + Pengumuman + layanannya sendiri
--   dopiper        : Pengumuman + Renungan + layanannya sendiri
--   mikat          : Pengumuman + layanannya sendiri
--
-- CARA PAKAI (Supabase > SQL Editor):
--   1. Jalankan BAGIAN 1 saja, tunggu sampai selesai.
--   2. Jalankan BAGIAN 2.
--   3. Buat akun di Authentication > Users (lihat catatan di bawah), lalu jalankan BAGIAN 3.
-- File ini aman dijalankan ulang.
-- ============================================================================


-- ===================== BAGIAN 1: izinkan nama peran baru =====================
do $$
declare
  c record;
  t text;
  v text;
begin
  -- Hapus pembatas CHECK pada kolom role (kalau ada) supaya peran baru boleh disimpan.
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;

  -- Kalau kolom role bertipe ENUM, tambahkan nilainya.
  select udt_name into t from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'role' and data_type = 'USER-DEFINED';
  if t is not null then
    foreach v in array array['penatalayanan', 'pembinaan', 'dopiper', 'mikat'] loop
      execute format('alter type public.%I add value if not exists %L', t, v);
    end loop;
  end if;
end $$;
-- ===================== AKHIR BAGIAN 1 (jalankan sendiri dulu) =====================


-- ===================== BAGIAN 2: izin akses =====================

-- Peran pengguna yang sedang login. 'infokom' (nama lama) dianggap 'penatalayanan'.
create or replace function public.peran_saya()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when role::text = 'infokom' then 'penatalayanan' else role::text end
  from public.profiles where id = auth.uid()
$$;
grant execute on function public.peran_saya() to authenticated;

update public.profiles set role = 'penatalayanan' where role::text = 'infokom';

-- Kolom baru
alter table public.announcements add column if not exists created_by uuid default auth.uid();
alter table public.announcements add column if not exists author_role text;
alter table public.services add column if not exists owner_role text;

-- Tebakan awal pemilik layanan dari judulnya. PERIKSA di admin (Layanan > Ubah > "Dikelola oleh") lalu betulkan bila perlu.
update public.services set owner_role = case
  when title ilike '%konseling%' then 'pembinaan'
  when title ilike '%prayer%' or title ilike '%doa%' or title ilike '%aksi kasih%' then 'dopiper'
  when title ilike '%berpelayanan%' or title ~* '(^|[^a-z])cp([^a-z]|$)' then 'mikat'
  else null
end
where owner_role is null;

-- Semua orang boleh membaca; hak menulis dibuat ulang di bawah.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['announcements', 'devotionals', 'committee', 'services', 'albums', 'album_photos', 'links', 'site_content'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('create policy %I on public.%I for select using (true)', t || '_baca', t);
  end loop;
end $$;

-- Konten website: BPH dan Penatalayanan.
do $$
declare t text;
begin
  foreach t in array array['committee', 'albums', 'album_photos', 'links', 'site_content'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format($f$create policy %I on public.%I for all to authenticated
      using (public.peran_saya() in ('bph', 'penatalayanan'))
      with check (public.peran_saya() in ('bph', 'penatalayanan'))$f$, t || '_tulis', t);
  end loop;
end $$;

-- Renungan: BPH, Penatalayanan, Dopiper.
create policy devotionals_tulis on public.devotionals for all to authenticated
  using (public.peran_saya() in ('bph', 'penatalayanan', 'dopiper'))
  with check (public.peran_saya() in ('bph', 'penatalayanan', 'dopiper'));

-- Pengumuman: semua departemen boleh membuat; mengubah/menghapus hanya milik sendiri (BPH dan Penatalayanan: semua).
create policy announcements_tambah on public.announcements for insert to authenticated
  with check (public.peran_saya() in ('bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'));
create policy announcements_ubah on public.announcements for update to authenticated
  using (public.peran_saya() in ('bph', 'penatalayanan') or (created_by = auth.uid() and public.peran_saya() in ('pembinaan', 'dopiper', 'mikat')))
  with check (public.peran_saya() in ('bph', 'penatalayanan') or (created_by = auth.uid() and public.peran_saya() in ('pembinaan', 'dopiper', 'mikat')));
create policy announcements_hapus on public.announcements for delete to authenticated
  using (public.peran_saya() in ('bph', 'penatalayanan') or (created_by = auth.uid() and public.peran_saya() in ('pembinaan', 'dopiper', 'mikat')));

-- Layanan: BPH dan Penatalayanan semuanya; departemen lain hanya layanan yang dikelolanya (kolom owner_role).
create policy services_tulis on public.services for all to authenticated
  using (public.peran_saya() in ('bph', 'penatalayanan') or (owner_role = public.peran_saya() and public.peran_saya() in ('pembinaan', 'dopiper', 'mikat')))
  with check (public.peran_saya() in ('bph', 'penatalayanan') or (owner_role = public.peran_saya() and public.peran_saya() in ('pembinaan', 'dopiper', 'mikat')));

-- Penyimpanan gambar (bucket uk3-media): semua peran admin boleh mengunggah.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and (coalesce(qual, '') || coalesce(with_check, '')) ilike '%uk3-media%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
create policy uk3_media_baca on storage.objects for select using (bucket_id = 'uk3-media');
create policy uk3_media_tambah on storage.objects for insert to authenticated
  with check (bucket_id = 'uk3-media' and public.peran_saya() in ('bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'));
create policy uk3_media_ubah on storage.objects for update to authenticated
  using (bucket_id = 'uk3-media' and public.peran_saya() in ('bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'));
create policy uk3_media_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'uk3-media' and public.peran_saya() in ('bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat'));
-- ===================== AKHIR BAGIAN 2 =====================


-- ===================== BAGIAN 3: tetapkan peran untuk akun baru =====================
-- Buat dulu akunnya di Authentication > Users > Add user > Create new user (centang Auto Confirm User).
-- Ganti email di bawah dengan email yang kamu pakai.
insert into public.profiles (id, role)
select id, case email
  when 'penatalayananukmuk3@gmail.com' then 'penatalayanan'
  when 'pembinaanukmuk3@gmail.com'     then 'pembinaan'
  when 'dopiperukmuk3@gmail.com'       then 'dopiper'
  when 'mikatukmuk3@gmail.com'         then 'mikat'
end
from auth.users
where email in ('penatalayananukmuk3@gmail.com', 'pembinaanukmuk3@gmail.com', 'dopiperukmuk3@gmail.com', 'mikatukmuk3@gmail.com')
on conflict (id) do update set role = excluded.role;
