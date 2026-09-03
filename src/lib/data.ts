import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMALAN_BY_ID } from "@/lib/amalan";
import type { CellValue, EntryStatus, MutabaahEntry, Santri } from "@/types";

export async function listSantri(kelas?: string): Promise<Santri[]> {
  const supabase = createAdminClient();
  let q = supabase.from("santri").select("*").order("nis");
  if (kelas) q = q.eq("kelas", kelas);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Santri[];
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
