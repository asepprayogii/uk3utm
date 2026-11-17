-- Keepalive Supabase lewat SQL (tanpa GitHub): database memanggil API-nya sendiri tiap hari.
-- Jalankan di Supabase > SQL Editor. GANTI dua nilai di bawah sebelum menjalankan:
--   <PROJECT_REF>  contoh: abcdxyzabcdxyz  (bagian depan URL proyek: https://<PROJECT_REF>.supabase.co)
--   <ANON_KEY>     isi sama dengan VITE_SUPABASE_ANON_KEY (kunci anon memang publik)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Hapus jadwal lama bila ada, supaya aman dijalankan ulang.
select cron.unschedule('keepalive-uk3')
where exists (select 1 from cron.job where jobname = 'keepalive-uk3');

-- Tiap hari 03:17 UTC (10:17 WIB): permintaan HTTP ke REST API, seperti pengunjung biasa.
select cron.schedule(
  'keepalive-uk3',
  '17 3 * * *',
  $$
  select net.http_get(
    url     := 'https://<PROJECT_REF>.supabase.co/rest/v1/site_content?select=key&limit=1',
    headers := jsonb_build_object(
      'apikey', '<ANON_KEY>',
      'Authorization', 'Bearer <ANON_KEY>'
    )
  );
  $$
);

-- Cek jadwal terdaftar:
--   select jobid, jobname, schedule, active from cron.job where jobname = 'keepalive-uk3';
-- Uji sekarang tanpa menunggu besok, lalu lihat hasilnya (status_code harus 200):
--   select net.http_get(url := 'https://<PROJECT_REF>.supabase.co/rest/v1/site_content?select=key&limit=1',
--          headers := jsonb_build_object('apikey','<ANON_KEY>','Authorization','Bearer <ANON_KEY>'));
--   select id, status_code, created from net._http_response order by created desc limit 3;
-- Riwayat eksekusi jadwal:
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
