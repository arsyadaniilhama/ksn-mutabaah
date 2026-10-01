import { NextResponse } from "next/server";
import { listSantri } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulanName } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/pdf-manifest?month=&year=&kelas=&mode=
 * Daftar santri aktif (institusi user, opsional per kelas) yang akan diekspor +
 * nama file ZIP akhir. Ringan (tanpa render PDF) supaya klien bisa mengunduh per batch.
 */
export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const kelas = searchParams.get("kelas") ?? undefined;
  const mode = searchParams.get("mode") === "m2" ? "m2" : "m1";
  if (!month || !year)
    return NextResponse.json({ error: "month, year wajib" }, { status: 400 });

  const santri = await listSantri(kelas, false, cu.institusi);
  const label = cu.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const scope = kelas ? kelas.replace(/\s+/g, "") : "Semua";

  return NextResponse.json({
    month,
    year,
    kelas: kelas ?? null,
    institusi: cu.institusi,
    label,
    namaFile: `Raport_${scope}_${label}_${mode === "m2" ? "AdabIbadah_" : ""}${bulanName(month)}${year}.zip`,
    santri: santri.map((s) => ({ id: s.id, nama: s.nama, nis: s.nis, kelas: s.kelas })),
  });
}