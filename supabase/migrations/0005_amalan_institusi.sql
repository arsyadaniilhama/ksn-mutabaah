-- Kategori amalan per institusi (null = berlaku untuk semua)
alter table amalan_kategori
  add column if not exists institusi text
  check (institusi in ('PA IMSHUS','PI IMSHUS'));

-- 11 kategori Adab khusus PI IMSHUS (id 20-30)
insert into amalan_kategori (id, nama, keterangan, value_type, urut, institusi) values
  (20, 'Makan/Minum Tidak Berdiri', null, 'binary', 20, 'PI IMSHUS'),
  (21, 'Menjaga Suara', null, 'binary', 21, 'PI IMSHUS'),
  (22, 'Membantu Ustadzah/Teman', null, 'binary', 22, 'PI IMSHUS'),
  (23, 'Memaafkan Kesalahan Orang Lain', null, 'binary', 23, 'PI IMSHUS'),
  (24, 'Menyapa Orang Lain', null, 'binary', 24, 'PI IMSHUS'),
  (25, 'Memanggil Teman Sesuai Nama', null, 'binary', 25, 'PI IMSHUS'),
  (26, 'Tidak Mengejek/Menertawakan Teman', null, 'binary', 26, 'PI IMSHUS'),
  (27, 'Tidak Mengghasab Barang Orang Lain', null, 'binary', 27, 'PI IMSHUS'),
  (28, 'Tidak Berkata Kotor', null, 'binary', 28, 'PI IMSHUS'),
  (29, 'Tidak Mencela Makanan', null, 'binary', 29, 'PI IMSHUS'),
  (30, 'Tidak Merusak Inventaris Asrama/Sekolah', null, 'binary', 30, 'PI IMSHUS')
on conflict (id) do update set
  nama = excluded.nama,
  keterangan = excluded.keterangan,
  value_type = excluded.value_type,
  urut = excluded.urut,
  institusi = excluded.institusi;
