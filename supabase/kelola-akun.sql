-- ============================================================================
-- Kelola akun dari panel admin (khusus BPH)
--
-- Menambahkan menu "Akun" di admin: BPH bisa melihat semua akun, membuat akun
-- baru, mengganti peran/nama, mereset kata sandi, dan menghapus akun.
--
-- Cara pakai: Supabase > SQL Editor > tempel seluruh file ini > Run.
-- Prasyarat: peran-departemen.sql sudah dijalankan (fungsi peran_saya()).
-- Aman dijalankan ulang.
--
-- Keamanan: setiap fungsi memeriksa peran_saya() = 'bph' di dalam database,
-- jadi akun lain tidak bisa memanggilnya walaupun lewat API langsung.
-- Kata sandi disimpan sebagai hash (bcrypt) oleh Supabase; tidak pernah
-- disimpan atau ditampilkan sebagai teks biasa.
-- ============================================================================

create or replace function public.akun_pastikan_bph()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(public.peran_saya(), '') <> 'bph' then
    raise exception 'Hanya BPH yang boleh mengelola akun.' using errcode = '42501';
  end if;
end $$;

-- ---- Daftar akun -----------------------------------------------------------
create or replace function public.akun_daftar()
returns table (
  id uuid, email text, name text, role text,
  dibuat timestamptz, terakhir_masuk timestamptz, terkonfirmasi boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  perform public.akun_pastikan_bph();
  return query
    select u.id, u.email::text, p.name::text,
           case when p.role::text = 'infokom' then 'penatalayanan' else coalesce(p.role::text, 'viewer') end,
           u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at;
end $$;

-- ---- Buat akun -------------------------------------------------------------
create or replace function public.akun_buat(p_email text, p_password text, p_role text, p_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid := gen_random_uuid();
begin
  perform public.akun_pastikan_bph();
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Format email tidak valid.'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'Kata sandi minimal 8 karakter.'; end if;
  if p_role not in ('bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat', 'viewer') then
    raise exception 'Peran tidak dikenal: %', p_role;
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % sudah terdaftar.', v_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());

  insert into public.profiles (id, email, role, name)
  values (v_id, v_email, p_role, nullif(trim(p_name), ''))
  on conflict (id) do update set email = excluded.email, role = excluded.role, name = excluded.name;

  return v_id;
end $$;

-- ---- Ubah peran / nama -----------------------------------------------------
create or replace function public.akun_ubah(p_id uuid, p_role text, p_name text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_lama text;
begin
  perform public.akun_pastikan_bph();
  if p_role not in ('bph', 'penatalayanan', 'pembinaan', 'dopiper', 'mikat', 'viewer') then
    raise exception 'Peran tidak dikenal: %', p_role;
  end if;
  if not exists (select 1 from auth.users where id = p_id) then raise exception 'Akun tidak ditemukan.'; end if;

  select role::text into v_lama from public.profiles where id = p_id;
  if v_lama = 'bph' and p_role <> 'bph'
     and (select count(*) from public.profiles where role::text = 'bph' and id <> p_id) = 0 then
    raise exception 'Tidak bisa: ini satu-satunya akun BPH. Jadikan akun lain BPH dulu.';
  end if;

  insert into public.profiles (id, email, role, name)
  select u.id, u.email, p_role, nullif(trim(p_name), '') from auth.users u where u.id = p_id
  on conflict (id) do update set role = excluded.role, name = excluded.name;
end $$;

-- ---- Reset kata sandi ------------------------------------------------------
create or replace function public.akun_sandi(p_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  perform public.akun_pastikan_bph();
  if length(coalesce(p_password, '')) < 8 then raise exception 'Kata sandi minimal 8 karakter.'; end if;
  update auth.users
     set encrypted_password = crypt(p_password, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = p_id;
  if not found then raise exception 'Akun tidak ditemukan.'; end if;
end $$;

-- ---- Hapus akun ------------------------------------------------------------
create or replace function public.akun_hapus(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.akun_pastikan_bph();
  if p_id = auth.uid() then raise exception 'Tidak bisa menghapus akun yang sedang kamu pakai.'; end if;
  if (select role::text from public.profiles where id = p_id) = 'bph'
     and (select count(*) from public.profiles where role::text = 'bph' and id <> p_id) = 0 then
    raise exception 'Tidak bisa menghapus satu-satunya akun BPH.';
  end if;
  delete from public.profiles where id = p_id;
  delete from auth.users where id = p_id;
end $$;

-- Hanya pengguna yang sudah login yang boleh memanggil (dan di dalamnya tetap dicek BPH).
revoke all on function public.akun_pastikan_bph() from public, anon;
revoke all on function public.akun_daftar() from public, anon;
revoke all on function public.akun_buat(text, text, text, text) from public, anon;
revoke all on function public.akun_ubah(uuid, text, text) from public, anon;
revoke all on function public.akun_sandi(uuid, text) from public, anon;
revoke all on function public.akun_hapus(uuid) from public, anon;
grant execute on function public.akun_daftar() to authenticated;
grant execute on function public.akun_buat(text, text, text, text) to authenticated;
grant execute on function public.akun_ubah(uuid, text, text) to authenticated;
grant execute on function public.akun_sandi(uuid, text) to authenticated;
grant execute on function public.akun_hapus(uuid) to authenticated;
