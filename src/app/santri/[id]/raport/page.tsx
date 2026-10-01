import { notFound } from "next/navigation";
import { getSantri, listEntries, listSantri, listHaidForMonth, getHaidDates } from "@/lib/data";
import { buildIdnData } from "@/lib/raport-idn";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel, bagianJakarta } from "@/lib/dates";
import RaportView from "./RaportView";
import type { RaportMode } from "@/components/RaportIdn";

export const dynamic = "force-dynamic";

/** Judul = "Nama — Bulan Tahun" (absolute, tanpa template) → jadi nama file default saat Save as PDF. */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const jkt = bagianJakarta();
  const year = Number(sp.year) || jkt.y;
  const month = Number(sp.month) || jkt.m;
  const santri = await getSantri(id);
  const judul = santri
    ? `${santri.nama} — ${monthLabel(month, year)}`
    : "Raport";
  return { title: { absolute: judul } };
}

export default async function RaportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string; mode?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const initialMode: RaportMode = sp.mode === "m2" ? "m2" : "m1";
  const jkt = bagianJakarta();
  const year = Number(sp.year) || jkt.y;
  const month = Number(sp.month) || jkt.m;

  const santri = await getSantri(id);
  if (!santri) notFound();
  const user = await getCurrentUser();
  if (user && santri.institusi !== user.institusi) notFound();

  const entries = await listEntries({ year, month, santriId: santri.id });
  const haidDates =
    santri.institusi === "PI IMSHUS"
      ? new Set(await getHaidDates(santri.id, year, month))
      : undefined;
  const m = computeSantriMetrics(santri, entries, year, month, haidDates);

  // Rata-rata kelas per hari (bilah abu Mode 2): hitung dari sekelas santri ini.
  // Hanya bila mode m2 agar halaman m1 tidak terbebani query tambahan.
  // Memakai listHaidForMonth (1 query bulk) agar haid tiap santri tetap akurat.
  let kelasAvg: { adab: number[]; ibadah: number[] } | undefined;
  if (initialMode === "m2") {
    try {
      const [sekelas, kelasEntries, haidMap] = await Promise.all([
        listSantri(santri.kelas, false, santri.institusi),
        listEntries({ year, month, kelas: santri.kelas, institusi: santri.institusi }),
        listHaidForMonth(year, month, santri.institusi),
      ]);
      const dim = new Date(year, month, 0).getDate();
      const sumA = new Array<number>(dim).fill(0);
      const sumI = new Array<number>(dim).fill(0);
      let na = 0;
      const ni = sekelas.length;
      for (const q of sekelas) {
        const qEntries = kelasEntries.filter((e) => e.santri_id === q.id);
        const qHaid = q.institusi === "PI IMSHUS" ? haidMap.get(q.id) : undefined;
        const d = buildIdnData(q, computeSantriMetrics(q, kelasEntries, year, month, qHaid), qEntries, year, month);
        if (d.dailyAdab.length > 0) {
          na++;
          d.dailyAdab.forEach((v, i) => { sumA[i] += v; });
        }
        d.dailyIbadah.forEach((v, i) => { sumI[i] += v; });
      }
      kelasAvg = {
        adab: sumA.map((v) => (na > 0 ? v / na : 0)),
        ibadah: sumI.map((v) => (ni > 0 ? v / ni : 0)),
      };
    } catch {
      kelasAvg = undefined;
    }
  }

  return (
    <RaportView
      santri={santri}
      metrics={m}
      entries={entries}
      year={year}
      month={month}
      haidDates={haidDates}
      initialMode={initialMode}
      kelasAvg={kelasAvg}
    />
  );
}