-- Jalankan sekali di Supabase: SQL Editor > New query > tempel semua > Run.
-- Memberi izin tulis kepada akun pengurus (role bph / infokom) untuk tabel yang dikelola dari panel admin.
-- Siapa pun tetap boleh MEMBACA (agar website publik tampil). Aman dijalankan ulang.

do $$
declare t text;
begin
  foreach t in array array['links', 'albums', 'album_photos']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_baca_semua', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_baca_semua', t);

    execute format('drop policy if exists %I on public.%I', t || '_tulis_pengurus', t);
    execute format($p$
      create policy %I on public.%I for all to authenticated
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('bph', 'infokom')))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('bph', 'infokom')))
    $p$, t || '_tulis_pengurus', t);
  end loop;
end $$;
