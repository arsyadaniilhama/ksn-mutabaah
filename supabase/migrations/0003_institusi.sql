-- Multi-institusi: PA IMSHUS (santri) & PI IMSHUS (santriwati)
alter table santri
  add column if not exists institusi text not null default 'PA IMSHUS'
  check (institusi in ('PA IMSHUS','PI IMSHUS'));

alter table profiles
  add column if not exists institusi text not null default 'PA IMSHUS'
  check (institusi in ('PA IMSHUS','PI IMSHUS'));

-- NIS unik per institusi (range PA & PI boleh sama)
alter table santri drop constraint if exists santri_nis_key;
alter table santri add constraint santri_institusi_nis_key unique (institusi, nis);
