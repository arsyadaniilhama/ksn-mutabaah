import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMALAN_BY_ID } from "@/lib/amalan";
import { valueLabel, type StoredCell } from "@/lib/audit";
import type { CellValue, EntryStatus, MutabaahEntry, Santri } from "@/types";

/* ===== In-Memory Caches (per instance, TTL singkat) =====
 * Menghindari roundtrip berulang ke Supabase saat navigasi tab/bulan.
 * Otomatis di-invalidate saat data berubah (upsert/update/create/setHaid).
 */
const santriCache = new Map<string, { data: Santri[]; at: number }>();
const entriesCache = new Map<string, { data: MutabaahEntry[]; at: number }>();
const progressCache = new Map<string, { data: Record<string, number>; at: number }>();
const coverageCache = new Map<string, { data: string[]; at: number }>();
const haidDatesCache = new Map<string, { data: string[]; at: number }>();
const haidMonthCache = new Map<string, { data: Map<string, Set<string>>; at: number }>();
const classDayValuesCache = new Map<string, { data: Record<string, Record<number, CellValue>>; at: number }>();

function invalidateMutation() {
  entriesCache.clear();
  progressCache.clear();
  coverageCache.clear();
  classDayValuesCache.clear();
}

function invalidateSantri() {
  santriCache.clear();
  entriesCache.clear();
  classDayValuesCache.clear();
}

function invalidateHaid() {
  haidDatesCache.clear();
  haidMonthCache.clear();
  entriesCache.clear();
}

export async function listSantri(
  kelas?: string,
  includeInactive = false,
  institusi?: string,
): Promise<Santri[]> {
  const cacheKey = `${kelas ?? ""}:${includeInactive}:${institusi ?? ""}`;
  const hit = santriCache.get(cacheKey);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;

  const supabase = createAdminClient();
  let q = supabase.from("santri").select("*").order("nis");
  if (kelas) q = q.eq("kelas", kelas);
  if (!includeInactive) q = q.eq("aktif", true);
  if (institusi) q = q.eq("institusi", institusi);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const res = (data ?? []) as Santri[];
  santriCache.set(cacheKey, { data: res, at: Date.now() });
  return res;
}

export async function createSantri(input: {
  nis: number;
  nama: string;
  kelas: string;
  institusi: string;
}): Promise<Santri> {
  const supabase = createAdminClient();
  const { data: dup } = await supabase
    .from("santri")
    .select("id")
    .eq("institusi", input.institusi)
    .eq("nis", input.nis)
    .maybeSingle();
  if (dup) throw new Error("NIS sudah dipakai santri lain di institusi ini.");
  const { data, error } = await supabase
    .from("santri")
    .insert({
      nis: input.nis,
      nama: input.nama,
      kelas: input.kelas,
      institusi: input.institusi,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  invalidateSantri();
  return data as Santri;
}

export async function updateSantri(
  id: string,
  patch: Partial<{ nis: number; nama: string; kelas: string; aktif: boolean }>,
  institusi?: string,
): Promise<Santri> {
  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("santri")
    .select("id,institusi")
    .eq("id", id)
    .maybeSingle();
  if (!current) throw new Error("Santri tidak ditemukan.");
  if (institusi && current.institusi !== institusi)
    throw new Error("Akses ditolak: santri bukan dari institusi Anda.");
  if (patch.nis != null) {
    const { data: dup } = await supabase
      .from("santri")
      .select("id")
      .eq("institusi", current.institusi)
      .eq("nis", patch.nis)
      .neq("id", id)
      .maybeSingle();
    if (dup) throw new Error("NIS sudah dipakai santri lain di institusi ini.");
  }
  const { data, error } = await supabase
    .from("santri")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  invalidateSantri();
  return data as Santri;
}

/** Jumlah amalan terisi per santri pada satu tanggal. */
export async function getDayProgress(date: string): Promise<Record<string, number>> {
  const hit = progressCache.get(date);
  if (hit && Date.now() - hit.at < 30_000) return hit.data;

  const supabase = createAdminClient();
  const rows = await fetchAll<{ santri_id: string }>((from, to) =>
    supabase
      .from("mutabaah_entries")
      .select("santri_id")
      .eq("entry_date", date)
      .or("status.not.is.null,rakaat.gt.0")
      .order("entry_date")
      .range(from, to),
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.santri_id] = (out[r.santri_id] ?? 0) + 1;
  progressCache.set(date, { data: out, at: Date.now() });
  return out;
}

/** Tanggal-tanggal pada bulan tertentu yang punya minimal satu nilai terisi. */
export async function getMonthCoverage(
  year: number,
  month: number,
): Promise<string[]> {
  const cacheKey = `${year}:${month}`;
  const hit = coverageCache.get(cacheKey);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;

  const supabase = createAdminClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const rows = await fetchAll<{ entry_date: string }>((from, to) =>
    supabase
      .from("mutabaah_entries")
      .select("entry_date")
      .gte("entry_date", start)
      .lte("entry_date", end)
      .or("status.not.is.null,rakaat.gt.0")
      .order("entry_date")
      .range(from, to),
  );
  const res = [...new Set(rows.map((r) => r.entry_date))];
  coverageCache.set(cacheKey, { data: res, at: Date.now() });
  return res;
}

export async function getSantri(id: string): Promise<Santri | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("santri")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Santri) ?? null;
}

/** Ambil SEMUA baris query dengan paginasi (PostgREST memotong di 1000 baris tanpa .range). */
async function fetchAll<T>(makeQuery: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await makeQuery(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

/** Ambil semua entri untuk rentang bulan (opsional filter kelas/santri/institusi). */
export async function listEntries(params: {
  year: number;
  month: number;
  kelas?: string;
  santriId?: string;
  institusi?: string;
}): Promise<MutabaahEntry[]> {
  const cacheKey = `${params.year}:${params.month}:${params.kelas ?? ""}:${params.santriId ?? ""}:${params.institusi ?? ""}`;
  const hit = entriesCache.get(cacheKey);
  if (hit && Date.now() - hit.at < 30_000) return hit.data;

  const supabase = createAdminClient();
  const start = `${params.year}-${String(params.month).padStart(2, "0")}-01`;
  const lastDay = new Date(params.year, params.month, 0).getDate();
  const end = `${params.year}-${String(params.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const COLS = "santri_id,amalan_id,entry_date,status,rakaat";

  // Filter institusi/kelas dikerjakan di server (IN list id), bukan menarik semua lalu disaring
  let idFilter: string[] | null = null;
  if (params.kelas || params.institusi) {
    const santri = await listSantri(params.kelas, true, params.institusi);
    idFilter = santri.map((s) => s.id);
    if (idFilter.length === 0) return [];
  }

  // 1x count lalu ambil semua halaman paralel (hemat round-trip serial)
  let cq = supabase
    .from("mutabaah_entries")
    .select(COLS, { count: "exact", head: true })
    .gte("entry_date", start)
    .lte("entry_date", end);
  if (params.santriId) {
    cq = cq.eq("santri_id", params.santriId);
  } else if (idFilter) {
    cq = cq.in("santri_id", idFilter);
  }
  const { count, error: cntErr } = await cq;
  if (cntErr) throw new Error(cntErr.message);
  const total = count ?? 0;
  const pageSize = 1000;

  const fetchRange = async (from: number, to: number): Promise<MutabaahEntry[]> => {
    let q = supabase
      .from("mutabaah_entries")
      .select(COLS)
      .gte("entry_date", start)
      .lte("entry_date", end)
      .order("entry_date")
      .range(from, to);
    if (params.santriId) {
      q = q.eq("santri_id", params.santriId);
    } else if (idFilter) {
      q = q.in("santri_id", idFilter);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as MutabaahEntry[];
  };

  let res: MutabaahEntry[];
  if (total <= pageSize) {
    res = await fetchRange(0, Math.max(0, total - 1));
  } else {
    const ranges: [number, number][] = [];
    for (let from = 0; from < total; from += pageSize)
      ranges.push([from, Math.min(total - 1, from + pageSize - 1)]);
    const parts = await Promise.all(ranges.map(([f, t]) => fetchRange(f, t)));
    res = parts.flat();
  }

  entriesCache.set(cacheKey, { data: res, at: Date.now() });
  return res;
}

/** Nilai 19 amalan untuk satu santri pada satu tanggal (untuk UI input). */
export async function getDayValues(
  santriId: string,
  date: string,
): Promise<Record<number, CellValue>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mutabaah_entries")
    .select("amalan_id,status,rakaat")
    .eq("santri_id", santriId)
    .eq("entry_date", date);
  if (error) throw new Error(error.message);
  const out: Record<number, CellValue> = {};
  for (const row of data ?? []) {
    const a = AMALAN_BY_ID[row.amalan_id as number];
    if (!a) continue;
    out[row.amalan_id as number] =
      a.value_type === "rakaat"
        ? (row.rakaat ?? null)
        : ((row.status as CellValue) ?? null);
  }
  return out;
}

/** Nilai mentah (status + rakaat) seluruh amalan satu santri pada satu tanggal. */
export async function getDayStored(
  santriId: string,
  date: string,
): Promise<Map<number, StoredCell>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mutabaah_entries")
    .select("amalan_id,status,rakaat")
    .eq("santri_id", santriId)
    .eq("entry_date", date);
  if (error) throw new Error(error.message);
  const out = new Map<number, StoredCell>();
  for (const row of data ?? []) {
    out.set(row.amalan_id as number, {
      status: (row.status as string | null) ?? null,
      rakaat: (row.rakaat as number | null) ?? null,
    });
  }
  return out;
}

/**
 * Nilai amalan untuk SEKELOMPOK santri (mis. satu kelas) pada satu tanggal dalam 1 query (~80ms).
 * Mengembalikan: santri_id -> amalan_id -> CellValue.
 * Sangat cepat untuk preloading / tab switching di /input.
 */
export async function getDayValuesForSantriList(
  santriIds: string[],
  date: string,
): Promise<Record<string, Record<number, CellValue>>> {
  if (santriIds.length === 0) return {};
  const cacheKey = `${santriIds.slice().sort().join(",")}:${date}`;
  const hit = classDayValuesCache.get(cacheKey);
  if (hit && Date.now() - hit.at < 30_000) return hit.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mutabaah_entries")
    .select("santri_id,amalan_id,status,rakaat")
    .in("santri_id", santriIds)
    .eq("entry_date", date);
  if (error) throw new Error(error.message);

  const out: Record<string, Record<number, CellValue>> = {};
  for (const sid of santriIds) out[sid] = {};

  for (const row of data ?? []) {
    const a = AMALAN_BY_ID[row.amalan_id as number];
    if (!a) continue;
    const sid = row.santri_id as string;
    if (!out[sid]) out[sid] = {};
    out[sid][row.amalan_id as number] =
      a.value_type === "rakaat"
        ? (row.rakaat ?? null)
        : ((row.status as CellValue) ?? null);
  }

  classDayValuesCache.set(cacheKey, { data: out, at: Date.now() });
  return out;
}

/** Aktivitas terbaru untuk feed dashboard. */
export interface RecentActivity {
  entry_date: string;
  amalan_id: number;
  status: EntryStatus | null;
  rakaat: number | null;
  santri: { nama: string; kelas: string } | null;
}

export async function listRecentEntries(
  limit = 10,
  institusi?: string,
): Promise<RecentActivity[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("mutabaah_entries")
    .select("entry_date, amalan_id, status, rakaat, santri:santri(nama, kelas)")
    .order("updated_at", { ascending: false });
  if (institusi) {
    const santri = await listSantri(undefined, true, institusi);
    q = q.in(
      "santri_id",
      santri.map((s) => s.id),
    );
  }
  const { data, error } = await q.limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RecentActivity[];
}

/** Tanggal haid satu santriwati pada satu bulan. */
export async function getHaidDates(
  santriId: string,
  year: number,
  month: number,
): Promise<string[]> {
  const cacheKey = `${santriId}:${year}:${month}`;
  const hit = haidDatesCache.get(cacheKey);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;

  const supabase = createAdminClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("haid_entries")
    .select("tanggal")
    .eq("santri_id", santriId)
    .gte("tanggal", start)
    .lte("tanggal", end);
  if (error) throw new Error(error.message);
  const res = (data ?? []).map((r) => r.tanggal as string);
  haidDatesCache.set(cacheKey, { data: res, at: Date.now() });
  return res;
}

/** Peta santri_id -> Set(tanggal haid) untuk satu bulan (opsional per institusi). */
export async function listHaidForMonth(
  year: number,
  month: number,
  institusi?: string,
): Promise<Map<string, Set<string>>> {
  const cacheKey = `${year}:${month}:${institusi ?? ""}`;
  const hit = haidMonthCache.get(cacheKey);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;

  const supabase = createAdminClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  let rows = await fetchAll<{ santri_id: string; tanggal: string }>((from, to) =>
    supabase
      .from("haid_entries")
      .select("santri_id,tanggal")
      .gte("tanggal", start)
      .lte("tanggal", end)
      .order("santri_id")
      .range(from, to),
  );
  if (institusi) {
    const ids = new Set((await listSantri(undefined, true, institusi)).map((s) => s.id));
    rows = rows.filter((r) => ids.has(r.santri_id));
  }
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!map.has(r.santri_id)) map.set(r.santri_id, new Set());
    map.get(r.santri_id)!.add(r.tanggal);
  }
  haidMonthCache.set(cacheKey, { data: map, at: Date.now() });
  return map;
}

/** Satu baris log aktivitas untuk halaman /log. */
export interface AuditLogRow {
  id: number;
  created_at: string;
  actor_email: string;
  actor_role: string | null;
  institusi: string | null;
  entity: string;
  action: string;
  santri_nama: string | null;
  santri_kelas: string | null;
  amalan_id: number | null;
  amalan_nama: string | null;
  entry_date: string | null;
  new_value: string | null;
  rakaat: number | null;
}

export interface AuditFilter {
  limit?: number;
  offset?: number;
  actor?: string;
  santriId?: string;
  action?: string;
  entity?: string;
  from?: string; // ISO date (WIB) awal
  to?: string; // ISO date (WIB) akhir (inklusif)
  q?: string; // cari nama santri / amalan
}

/** Apakah tabel audit_log sudah ada (migrasi 0007 dijalankan). */
export async function auditTableExists(): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("audit_log")
    .select("id", { head: true, count: "exact" })
    .limit(1);
  return !error;
}

/** Daftar log aktivitas mutabaah (terbaru dulu) + total untuk paginasi. */
export async function listAuditLog(
  f: AuditFilter,
  institusi?: string,
): Promise<{ rows: AuditLogRow[]; total: number }> {
  const supabase = createAdminClient();
  const limit = Math.min(200, Math.max(1, f.limit ?? 50));
  const offset = Math.max(0, f.offset ?? 0);
  let q = supabase
    .from("audit_log")
    .select(
      "id,created_at,actor_email,actor_role,institusi,entity,action,santri_nama,santri_kelas,amalan_id,amalan_nama,entry_date,new_value,rakaat",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (institusi) q = q.eq("institusi", institusi);
  if (f.actor) q = q.eq("actor_email", f.actor);
  if (f.santriId) q = q.eq("santri_id", f.santriId);
  if (f.action) q = q.eq("action", f.action);
  if (f.entity) q = q.eq("entity", f.entity);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00+07:00`);
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59+07:00`);
  if (f.q) {
    const safe = f.q.replace(/[,%()]/g, " ").trim().slice(0, 60);
    if (safe) q = q.or(`santri_nama.ilike.%${safe}%,amalan_nama.ilike.%${safe}%`);
  }
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as AuditLogRow[], total: count ?? 0 };
}

/** Daftar akun unik yang pernah muncul di log (untuk dropdown filter). */
export async function listAuditActors(): Promise<string[]> {
  const supabase = createAdminClient();
  const rows = await fetchAll<{ actor_email: string }>((from, to) =>
    supabase
      .from("audit_log")
      .select("actor_email")
      .order("actor_email")
      .range(from, to),
  );
  return [...new Set(rows.map((r) => r.actor_email))].filter(Boolean).sort();
}

/** Ringkasan jumlah aksi hari ini (WIB) untuk kartu statistik. */
export async function auditSummaryToday(todayIso: string, institusi?: string) {
  const supabase = createAdminClient();
  const start = `${todayIso}T00:00:00+07:00`;
  const end = `${todayIso}T23:59:59+07:00`;
  const base = () => {
    let q = supabase
      .from("audit_log")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", start)
      .lte("created_at", end);
    if (institusi) q = q.eq("institusi", institusi);
    return q;
  };
  const [check, uncheck, actors] = await Promise.all([
    base().eq("action", "check"),
    base().eq("action", "uncheck"),
    (async () => {
      let q = supabase
        .from("audit_log")
        .select("actor_email")
        .gte("created_at", start)
        .lte("created_at", end);
      if (institusi) q = q.eq("institusi", institusi);
      const { data } = await q.limit(1000);
      return new Set((data ?? []).map((r) => r.actor_email)).size;
    })(),
  ]);
  return {
    check: check.count ?? 0,
    uncheck: uncheck.count ?? 0,
    akunAktif: actors,
  };
}

/** Tandai/batalkan hari haid. */
export async function setHaid(
  santriId: string,
  tanggal: string,
  on: boolean,
): Promise<void> {
  const supabase = createAdminClient();
  if (on) {
    const { error } = await supabase
      .from("haid_entries")
      .upsert({ santri_id: santriId, tanggal }, { onConflict: "santri_id,tanggal" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("haid_entries")
      .delete()
      .eq("santri_id", santriId)
      .eq("tanggal", tanggal);
    if (error) throw new Error(error.message);
  }
  invalidateHaid();
}

/** Upsert massal; konflik pada (santri_id, amalan_id, entry_date). */
export async function upsertEntries(
  entries: {
    santri_id: string;
    amalan_id: number;
    entry_date: string;
    status?: EntryStatus | null;
    rakaat?: number | null;
  }[],
  actor?: { id: string; email: string },
): Promise<void> {
  if (entries.length === 0) return;
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const rows = entries.map((e) => ({
    santri_id: e.santri_id,
    amalan_id: e.amalan_id,
    entry_date: e.entry_date,
    status: e.status ?? null,
    rakaat: e.rakaat ?? null,
    // jejak siapa & kapan terakhir mengubah (dipakai feed "Aktivitas Terakhir")
    updated_by: actor?.id ?? null,
    updated_by_email: actor?.email ?? null,
    updated_at: nowIso,
  }));
  const { error } = await supabase
    .from("mutabaah_entries")
    .upsert(rows, {
      onConflict: "santri_id,amalan_id,entry_date",
    });
  if (error) {
    // Fallback: bila kolom updated_by_email belum ada (migrasi belum jalan),
    // coba lagi tanpa kolom tersebut agar penyimpanan tetap berhasil.
    if (/updated_by_email/i.test(error.message)) {
      const legacy = rows.map(({ updated_by_email: _skip, ...rest }) => rest);
      const { error: e2 } = await supabase
        .from("mutabaah_entries")
        .upsert(legacy, { onConflict: "santri_id,amalan_id,entry_date" });
      if (e2) throw new Error(e2.message);
    } else {
      throw new Error(error.message);
    }
  }
  invalidateMutation();
}
