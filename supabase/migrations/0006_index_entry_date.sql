-- Index untuk query rentang bulan (listEntries/getMonthCoverage menyaring entry_date)
create index if not exists idx_entries_entry_date on mutabaah_entries (entry_date);
