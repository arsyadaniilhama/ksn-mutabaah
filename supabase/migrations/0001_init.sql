-- Mutabaah KSN — skema awal
create extension if not exists pgcrypto;

-- ===== profiles (auto dari auth.users) =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  nama text
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role) values (new.id, 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== santri =====
create table if not exists santri (
  id uuid primary key default gen_random_uuid(),
  nis integer unique not null,
  nama text not null,
  kelas text not null check (kelas in ('Kelas 1','Kelas 2','Kelas 3')),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ===== amalan_kategori =====
create table if not exists amalan_kategori (
  id smallint primary key,
  nama text not null,
  keterangan text,
  value_type text not null check (value_type in ('binary','rakaat')),
  urut smallint not null
);

-- ===== mutabaah_entries =====
create table if not exists mutabaah_entries (
  id uuid primary key default gen_random_uuid(),
  santri_id uuid not null references santri(id) on delete cascade,
  amalan_id smallint not null references amalan_kategori(id),
  entry_date date not null,
  status text check (status in ('done','miss')),
  rakaat smallint check (rakaat between 0 and 100),
  catatan text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (santri_id, amalan_id, entry_date)
);
create index if not exists idx_entries_month
  on mutabaah_entries (santri_id, entry_date);

-- ===== RLS =====
alter table profiles enable row level security;
alter table santri enable row level security;
alter table amalan_kategori enable row level security;
alter table mutabaah_entries enable row level security;

-- profiles: user bisa baca dirinya
create policy "profile_self" on profiles
  for select using (auth.uid() = id);

-- admin-only policies (role='admin' di profiles)
create policy "admin_read_santri" on santri
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "admin_write_santri" on santri
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));

create policy "admin_read_kategori" on amalan_kategori
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "admin_write_kategori" on amalan_kategori
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));

create policy "admin_read_entries" on mutabaah_entries
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "admin_write_entries" on mutabaah_entries
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
