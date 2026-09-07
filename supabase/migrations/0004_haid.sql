-- Hari haid santriwati (khusus PI IMSHUS): membebaskan hari dari perhitungan
create table if not exists haid_entries (
  santri_id uuid not null references santri(id) on delete cascade,
  tanggal date not null,
  created_at timestamptz not null default now(),
  primary key (santri_id, tanggal)
);

alter table haid_entries enable row level security;

create policy "admin_read_haid" on haid_entries
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "admin_write_haid" on haid_entries
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
