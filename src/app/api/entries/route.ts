import { NextResponse } from "next/server";
import {
  getDayStored,
  getDayValues,
  getDayValuesForSantriList,
  getSantri,
  listSantri,
  upsertEntries,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulkUpsertSchema } from "@/lib/validations";
import { diffMutabaah, writeAudit, type AuditRow, type StoredCell } from "@/lib/audit";

async function allowedSantriIds(institusi: string): Promise<Set<string>> {
  const santri = await listSantri(undefined, true, institusi);
  return new Set(santri.map((s) => s.id));
}

export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const santriId = searchParams.get("santri_id");
  const kelas = searchParams.get("kelas");
  const date = searchParams.get("date");
  if (!date)
    return NextResponse.json({ error: "date wajib" }, { status: 400 });

  // Mode bulk per kelas: ambil seluruh santri di kelas tersebut dalam 1 query cepat (~80ms)
  if (kelas) {
    const santriList = await listSantri(kelas, false, cu.institusi);
    const dayValues = await getDayValuesForSantriList(
      santriList.map((s) => s.id),
      date,
    );
    return NextResponse.json({ dayValues });
  }

  // Mode single santri (kompatibel dgn pemanggil sebelumnya)
  if (!santriId)
    return NextResponse.json({ error: "santri_id atau kelas wajib" }, { status: 400 });

  const ids = await allowedSantriIds(cu.institusi);
  if (!ids.has(santriId))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const values = await getDayValues(santriId, date);
  return NextResponse.json({ values });
}

export async function POST(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const parsed = bulkUpsertSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const ids = await allowedSantriIds(cu.institusi);
  if (parsed.data.entries.some((e) => !ids.has(e.santri_id)))
    return NextResponse.json(
      { error: "Akses ditolak: santri bukan dari institusi Anda." },
      { status: 403 },
    );

  try {
    // Nilai lama (per santri+tanggal) untuk membandingkan centang vs batal-centang.
    const pairs = new Map<string, { santriId: string; date: string }>();
    for (const e of parsed.data.entries) {
      pairs.set(`${e.santri_id}:${e.entry_date}`, {
        santriId: e.santri_id,
        date: e.entry_date,
      });
    }
    const beforeByKey = new Map<string, Map<number, StoredCell>>();
    await Promise.all(
      [...pairs.entries()].map(async ([key, p]) => {
        beforeByKey.set(key, await getDayStored(p.santriId, p.date));
      }),
    );

    await upsertEntries(parsed.data.entries, { id: cu.id, email: cu.email });

    // Susun batas "sesudah" lalu turunkan baris log (hanya centang/batal-centang).
    const afterByKey = new Map<string, Map<number, StoredCell>>();
    for (const [key, map] of beforeByKey) {
      afterByKey.set(key, new Map(map));
    }
    for (const e of parsed.data.entries) {
      const key = `${e.santri_id}:${e.entry_date}`;
      let m = afterByKey.get(key);
      if (!m) {
        m = new Map<number, StoredCell>();
        afterByKey.set(key, m);
      }
      m.set(e.amalan_id, {
        status: (e.status as string | null) ?? null,
        rakaat: (e.rakaat as number | null) ?? null,
      });
    }

    const santriCache = new Map<string, Awaited<ReturnType<typeof getSantri>>>();
    const auditRows: AuditRow[] = [];
    for (const key of pairs.keys()) {
      const p = pairs.get(key)!;
      if (!santriCache.has(p.santriId)) {
        santriCache.set(p.santriId, await getSantri(p.santriId));
      }
      const santri = santriCache.get(p.santriId);
      if (!santri) continue;
      auditRows.push(
        ...diffMutabaah(cu, santri, p.date, beforeByKey.get(key)!, afterByKey.get(key)!),
      );
    }
    await writeAudit(auditRows);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal menyimpan" },
      { status: 500 },
    );
  }
}
