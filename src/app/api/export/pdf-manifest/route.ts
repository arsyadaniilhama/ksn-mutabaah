import { NextResponse } from "next/server";
import { listSantri } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { bulanName } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/pdf-manifest?month=&year=
 * Daftar santri aktif (institusi user) yang akan diekspor + nama file ZIP akhir.
 * Ringan (tanpa render PDF) supaya klien bisa mengunduh raport per batch.
 */
export async function GET(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  if (!month || !year)
    return NextResponse.json({ error: "month, year wajib" }, { status: 400 });

  const santri = await listSantri(undefined, false, cu.institusi);
  const label = cu.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";

  return NextResponse.json({
    month,
    year,
    institusi: cu.institusi,
    label,
    namaFile: `Raport_Semua_${label}_${bulanName(month)}${year}.zip`,
    santri: santri.map((s) => ({ id: s.id, nama: s.nama, nis: s.nis, kelas: s.kelas })),
  });
}