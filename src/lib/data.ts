import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMALAN_BY_ID } from "@/lib/amalan";
import type { CellValue, EntryStatus, MutabaahEntry, Santri } from "@/types";

export async function listSantri(
  kelas?: string,
  includeInactive = false,
  institusi?: string,
): Promise<Santri[]> {
  const supabase = createAdminClient();
  let q = supabase.from("santri").select("*").order("nis");
  if (kelas) q = q.eq("kelas", kelas);
  if (!includeInactive) q = q.eq("aktif", true);
  if (institusi) q = q.eq("institusi", institusi);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Santri[];
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
  return data as Santri;
}

/** Jumlah amalan terisi per santri pada satu tanggal. */
export async function getDayProgress(date: string): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  const rows = await fetchAll<{ santri_id: string }>((from, to) =>
    supabase
      .from("mutabaah_entries")
      .select("santri_id")
      .eq("entry_date", date)
      .or("status.not.is.null,rakaat.gt.0")
      .order("id")
      .range(from, to),
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.santri_id] = (out[r.santri_id] ?? 0) + 1;
  return out;
}

/** Tanggal-tanggal pada bulan tertentu yang punya minimal satu nilai terisi. */
export async function getMonthCoverage(
  year: number,
  month: number,
): Promise<string[]> {
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
      .order("id")
      .range(from, to),
  );
  return [...new Set(rows.map((r) => r.entry_date))];
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
      .order("id")
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

  if (total <= pageSize) return fetchRange(0, Math.max(0, total - 1));
  const ranges: [number, number][] = [];
  for (let from = 0; from < total; from += pageSize)
    ranges.push([from, Math.min(total - 1, from + pageSize - 1)]);
  const parts = await Promise.all(ranges.map(([f, t]) => fetchRange(f, t)));
  return parts.flat();
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
  return (data ?? []).map((r) => r.tanggal as string);
}

/** Peta santri_id -> Set(tanggal haid) untuk satu bulan (opsional per institusi). */
export async function listHaidForMonth(
  year: number,
  month: number,
  institusi?: string,
): Promise<Map<string, Set<string>>> {
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
  return map;
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
): Promise<void> {
  if (entries.length === 0) return;
  const supabase = createAdminClient();
  const rows = entries.map((e) => ({
    santri_id: e.santri_id,
    amalan_id: e.amalan_id,
    entry_date: e.entry_date,
    status: e.status ?? null,
    rakaat: e.rakaat ?? null,
  }));
  const { error } = await supabase
    .from("mutabaah_entries")
    .upsert(rows, {
      onConflict: "santri_id,amalan_id,entry_date",
    });
  if (error) throw new Error(error.message);
}
