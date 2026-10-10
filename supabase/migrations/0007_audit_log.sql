-- ============================================================================
-- 0007_audit_log.sql
-- Log aktivitas mutabaah (audit trail) + jejak akun pada entri.
-- Menjawab: SIAPA (akun apa) yang mencentang / membatalkan amalan, amalan apa,
-- untuk tanggal berapa, dan pada JAM berapa.
-- Hanya superadmin yang boleh membaca; aplikasi menulis via service-role
-- (melewati RLS) supaya tidak bisa dipalsukan dari sisi klien.
-- ============================================================================

-- 1) Jejak akun pada entri mutabaah sendiri (siapa terakhir mengubah).
--    updated_by sudah ada sejak 0001; tambahkan email agar log lebih mudah dibaca
--    dan feed "Aktivitas Terakhir" akurat.
alter table mutabaah_entries
  add column if not exists updated_by_email text;

-- 2) Tabel log aktivitas.
create table if not exists audit_log (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),   -- waktu kejadian (UTC, tampil WIB)

  actor_id      uuid references auth.users(id) on delete set null,
  actor_email   text not null,                        -- akun pelaku
  actor_role    text,
  institusi     text,                                 -- institusi aktif saat aksi

  entity        text not null default 'mutabaah',     -- 'mutabaah' | 'haid'
  action        text not null,                        -- check | uncheck | set | haid_on | haid_off

  santri_id     uuid references santri(id) on delete set null,
  santri_nama   text,                                 -- snapshot nama saat aksi
  santri_kelas  text,

  amalan_id     smallint,
  amalan_nama   text,

  entry_date    date,                                 -- tanggal mutabaah yang diisi
  old_value     text,                                 -- nilai sebelum (raw)
  new_value     text,                                 -- nilai sesudah (raw)
  rakaat        integer                               -- jumlah rakaat (bila bertipe rakaat)
);

create index if not exists idx_audit_created    on audit_log (created_at desc);
create index if not exists idx_audit_actor      on audit_log (actor_email, created_at desc);
create index if not exists idx_audit_santri     on audit_log (santri_id, created_at desc);
create index if not exists idx_audit_institusi  on audit_log (institusi, created_at desc);
create index if not exists idx_audit_action     on audit_log (action, created_at desc);
create index if not exists idx_audit_entry_date on audit_log (entry_date desc);

alter table audit_log enable row level security;

-- Baca hanya untuk superadmin. Tidak ada policy insert/update/delete:
-- service role (server) yang menulis, sehingga isi log tidak dapat dipalsukan.
drop policy if exists "audit_read_superadmin" on audit_log;
create policy "audit_read_superadmin" on audit_log
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );
