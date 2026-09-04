import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMALAN_BY_ID } from "@/lib/amalan";
import type { CellValue, EntryStatus, MutabaahEntry, Santri } from "@/types";

export async function listSantri(kelas?: string, includeInactive = false): Promise<Santri[]> {
  const supabase = createAdminClient();
  let q = supabase.from("santri").select("*").order("nis");
  if (kelas) q = q.eq("kelas", kelas);
  if (!includeInactive) q = q.eq("aktif", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Santri[];
}

export async function createSantri(input: {
  nis: number;
  nama: string;
  kelas: string;
}): Promise<Santri> {
  const supabase = createAdminClient();
  const { data: dup } = await supabase
    .from("santri")
    .select("id")
    .eq("nis", input.nis)
    .maybeSingle();
  if (dup) throw new Error("NIS sudah dipakai santri lain.");
  const { data, error } = await supabase
    .from("santri")
    .insert({ nis: input.nis, nama: input.nama, kelas: input.kelas })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Santri;
}

export async function updateSantri(
  id: string,
  patch: Partial<{ nis: number; nama: string; kelas: string; aktif: boolean }>,
): Promise<Santri> {
  const supabase = createAdminClient();
  if (patch.nis != null) {
    const { data: dup } = await supabase
      .from("santri")
      .select("id")
      .eq("nis", patch.nis)
      .neq("id", id)
      .maybeSingle();
    if (dup) throw new Error("NIS sudah dipakai santri lain.");
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
  const { data, error } = await supabase
    .from("mutabaah_entries")
    .select("santri_id")
    .eq("entry_date", date)
    .or("status.not.is.null,rakaat.gt.0");
  if (error) throw new Error(error.message);
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    out[r.santri_id as string] = (out[r.santri_id as string] ?? 0) + 1;
  }
  return out;
}

/** Tanggal-tanggal pada bulan tertentu yang punya minimal satu entri. */
export async function getMonthCoverage(
  year: number,
  month: number,
): Promise<string[]> {
  const supabase = createAdminClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("mutabaah_entries")
    .select("entry_date")
    .gte("entry_date", start)
    .lte("entry_date", end);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((r) => r.entry_date as string))];
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

/** Ambil semua entri untuk rentang bulan (opsional filter kelas/santri). */
export async function listEntries(params: {
  year: number;
  month: number;
  kelas?: string;
  santriId?: string;
}): Promise<MutabaahEntry[]> {
  const supabase = createAdminClient();
  const start = `${params.year}-${String(params.month).padStart(2, "0")}-01`;
  const lastDay = new Date(params.year, params.month, 0).getDate();
  const end = `${params.year}-${String(params.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let q = supabase
    .from("mutabaah_entries")
    .select("*")
    .gte("entry_date", start)
    .lte("entry_date", end);
  if (params.santriId) q = q.eq("santri_id", params.santriId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as MutabaahEntry[];

  if (params.kelas) {
    const santri = await listSantri(params.kelas);
    const ids = new Set(santri.map((s) => s.id));
    rows = rows.filter((r) => ids.has(r.santri_id));
  }
  return rows;
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

export async function listRecentEntries(limit = 10): Promise<RecentActivity[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mutabaah_entries")
    .select("entry_date, amalan_id, status, rakaat, santri:santri(nama, kelas)")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RecentActivity[];
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
