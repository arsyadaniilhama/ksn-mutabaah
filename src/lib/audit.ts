import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMALAN_BY_ID } from "@/lib/amalan";
import type { CurrentUser } from "@/lib/auth";
import type { Santri } from "@/types";

/** Nilai sel yang tersimpan (mentah) sebelum/sesudah perubahan. */
export interface StoredCell {
  status: string | null;
  rakaat: number | null;
}

export type AuditAction = "check" | "uncheck" | "set" | "haid_on" | "haid_off";

/** Satu baris yang akan ditulis ke audit_log. */
export interface AuditRow {
  actor_id: string | null;
  actor_email: string;
  actor_role: string | null;
  institusi: string | null;
  entity: "mutabaah" | "haid";
  action: AuditAction;
  santri_id: string | null;
  santri_nama: string | null;
  santri_kelas: string | null;
  amalan_id: number | null;
  amalan_nama: string | null;
  entry_date: string | null;
  old_value: string | null;
  new_value: string | null;
  rakaat: number | null;
}

/** Label nilai yang enak dibaca (untuk ditampilkan di halaman log). */
export function valueLabel(
  amalanId: number,
  cell: StoredCell | null | undefined,
): string | null {
  if (!cell) return null;
  const a = AMALAN_BY_ID[amalanId];
  if (!a) return null;
  if (a.value_type === "rakaat") {
    const r = cell.rakaat ?? 0;
    return r > 0 ? `${r} rakaat` : null;
  }
  if (a.value_type === "fardhu") {
    const map: Record<string, string> = {
      tepat: "Tepat Waktu",
      masbuq: "Masbuq",
      sendiri: "Sendiri",
    };
    return cell.status ? (map[cell.status] ?? cell.status) : null;
  }
  if (cell.status === "done") return "Ya";
  if (cell.status === "miss") return "Tidak";
  return null;
}

/** Apakah sel dianggap "terisi" (angka rakaat/shollat/ya). */
function isFilled(amalanId: number, cell: StoredCell | null): boolean {
  if (!cell) return false;
  const a = AMALAN_BY_ID[amalanId];
  if (!a) return false;
  if (a.value_type === "rakaat") return (cell.rakaat ?? 0) > 0;
  return cell.status != null;
}

function actionFor(before: boolean, after: boolean): AuditAction {
  if (!before && after) return "check";
  if (before && !after) return "uncheck";
  return "set";
}

/**
 * Bandingkan nilai lama vs baru lalu kembalikan baris audit HANYA untuk sel
 * yang benar-benar berubah dan "bermakna" (nilai terisi bertambah/berkurang).
 * Perubahan angka rakaat pada sel yang tetap >0 (mis. 4 -> 5) tidak dicatat
 * agar log tidak banjir; yang dicatat adalah centang / batal-centang.
 */
export function diffMutabaah(
  cu: Pick<CurrentUser, "id" | "email" | "role" | "institusi">,
  santri: Santri,
  date: string,
  before: Map<number, StoredCell>,
  after: Map<number, StoredCell>,
): AuditRow[] {
  const rows: AuditRow[] = [];
  const ids = new Set<number>([...before.keys(), ...after.keys()]);
  for (const amalanId of ids) {
    const b = before.get(amalanId) ?? null;
    const a = after.get(amalanId) ?? null;
    const bFilled = isFilled(amalanId, b);
    const aFilled = isFilled(amalanId, a);
    if (bFilled === aFilled) continue; // hanya centang/batal-centang
    rows.push({
      actor_id: cu.id,
      actor_email: cu.email,
      actor_role: cu.role,
      institusi: cu.institusi,
      entity: "mutabaah",
      action: actionFor(bFilled, aFilled),
      santri_id: santri.id,
      santri_nama: santri.nama,
      santri_kelas: santri.kelas,
      amalan_id: amalanId,
      amalan_nama: AMALAN_BY_ID[amalanId]?.nama ?? null,
      entry_date: date,
      old_value: valueLabel(amalanId, b),
      new_value: valueLabel(amalanId, a),
      rakaat: a?.rakaat ?? null,
    });
  }
  return rows;
}

/** Baris audit untuk tandai/hapus hari haid. */
export function haidRow(
  cu: Pick<CurrentUser, "id" | "email" | "role" | "institusi">,
  santri: Santri,
  date: string,
  on: boolean,
): AuditRow {
  return {
    actor_id: cu.id,
    actor_email: cu.email,
    actor_role: cu.role,
    institusi: cu.institusi,
    entity: "haid",
    action: on ? "haid_on" : "haid_off",
    santri_id: santri.id,
    santri_nama: santri.nama,
    santri_kelas: santri.kelas,
    amalan_id: null,
    amalan_nama: "Haid (dibebaskan)",
    entry_date: date,
    old_value: on ? null : "Haid",
    new_value: on ? "Haid" : null,
    rakaat: null,
  };
}

/**
 * Tulis baris audit. Sengaja tidak pernah melempar error: kegagalan mencatat
 * log TIDAK boleh menggagalkan penyimpanan mutabaah yang sesungguhnya.
 * Bila tabel belum ada (migrasi belum dijalankan), error diabaikan diam-diam.
 */
export async function writeAudit(rows: AuditRow[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert(rows);
    if (error) console.warn("[audit] gagal menulis log:", error.message);
  } catch (e) {
    console.warn("[audit] gagal menulis log:", e instanceof Error ? e.message : e);
  }
}
