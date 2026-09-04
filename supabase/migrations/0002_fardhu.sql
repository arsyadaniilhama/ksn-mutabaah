-- Tambah tipe nilai 'fardhu' (Tepat Waktu / Masbuq / Sendiri) untuk 5 sholat fardhu
alter table amalan_kategori
  drop constraint if exists amalan_kategori_value_type_check;
alter table amalan_kategori
  add constraint amalan_kategori_value_type_check
  check (value_type in ('binary','rakaat','fardhu'));

alter table mutabaah_entries
  drop constraint if exists mutabaah_entries_status_check;
alter table mutabaah_entries
  add constraint mutabaah_entries_status_check
  check (status in ('done','miss','tepat','masbuq','sendiri'));

update amalan_kategori
set value_type = 'fardhu',
    keterangan = 'Tepat Waktu / Masbuq / Sendiri'
where id in (3, 8, 10, 13, 15);
