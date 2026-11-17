-- Mengganti ejaan "Trunojoyo" menjadi "Trunodjoyo" pada SEMUA isi yang sudah tersimpan di database
-- (tentang kami, visi/misi, pengumuman, renungan, layanan, judul foto, dll.).
-- Teks yang ada di kode situs sudah diganti lewat file proyek; ini untuk data yang Anda ketik lewat panel admin.
-- Aman dijalankan berulang. Jalankan di Supabase > SQL Editor.

do $$
declare
  c record;
  n bigint;
  total bigint := 0;
begin
  for c in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and data_type in ('text', 'character varying')
      and column_name !~* '(url|token|email|password|key$)'
      and table_name in (select tablename from pg_tables where schemaname = 'public')
  loop
    execute format(
      'update public.%I set %I = replace(%I, %L, %L) where %I like %L',
      c.table_name, c.column_name, c.column_name, 'Trunojoyo', 'Trunodjoyo', c.column_name, '%Trunojoyo%'
    );
    get diagnostics n = row_count;
    if n > 0 then
      raise notice 'Diperbaiki % baris di %.%', n, c.table_name, c.column_name;
      total := total + n;
    end if;
  end loop;
  raise notice 'Selesai. Total baris yang diperbaiki: %', total;
end $$;
