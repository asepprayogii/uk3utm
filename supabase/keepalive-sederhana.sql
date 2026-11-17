-- Keepalive paling sederhana: tidak perlu mengganti apa pun, tinggal Run.
-- Database mencatat "denyut" ke tabel kecil setiap hari lewat pg_cron.

create extension if not exists pg_cron;

create table if not exists public.keepalive (
  id        int primary key default 1,
  last_ping timestamptz not null default now(),
  constraint satu_baris check (id = 1)
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;

-- Tabel ini internal: RLS aktif tanpa policy, jadi tidak bisa dibaca/ditulis lewat API publik.
alter table public.keepalive enable row level security;

select cron.unschedule('keepalive-sederhana')
where exists (select 1 from cron.job where jobname = 'keepalive-sederhana');

-- Tiap hari 03:17 UTC (10:17 WIB).
select cron.schedule(
  'keepalive-sederhana',
  '17 3 * * *',
  $$ update public.keepalive set last_ping = now() where id = 1; $$
);

-- Cek (setelah jadwal pertama lewat, atau jalankan baris update di atas manual):
--   select * from public.keepalive;
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
