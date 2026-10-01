import { listSantri, listEntries, listHaidForMonth } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel, bagianJakarta } from "@/lib/dates";
import RaportSantri from "@/components/RaportSantri";
import RaportIdn, { type RaportMode } from "@/components/RaportIdn";
import { buildIdnData } from "@/lib/raport-idn";
import CetakToolbar from "./CetakToolbar";
import type { Kelas, MutabaahEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; month?: string; year?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  const jkt = bagianJakarta();
  const month = Number(sp.month) || jkt.m;
  const year = Number(sp.year) || jkt.y;
  const kelas = sp.kelas ?? "Kelas 1";
  const modeT = sp.mode === "m2" ? "Adab & Ibadah" : "Hijau";
  return {
    title: { absolute: `Raport ${kelas} (${modeT}) — ${monthLabel(month, year)}` },
  };
}

export default async function CetakKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; month?: string; year?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  const jkt = bagianJakarta();
  const month = Number(sp.month) || jkt.m;
  const year = Number(sp.year) || jkt.y;
  const user = await getCurrentUser();
  const institusi = user?.institusi ?? "PA IMSHUS";
  const kelas = (sp.kelas ?? "Kelas 1") as Kelas;
  const mode: RaportMode = sp.mode === "m2" ? "m2" : "m1";
  const label = institusi === "PI IMSHUS" ? "santriwati" : "santri";

  const [santri, entries, haidMap] = await Promise.all([
    listSantri(kelas, false, institusi),
    listEntries({ year, month, kelas, institusi }),
    listHaidForMonth(year, month, institusi),
  ]);

  if (santri.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-muted">
        Belum ada {label} aktif di {kelas}.
      </div>
    );
  }

  const allMetrics = santri.map((s) => {
    const haidDates = haidMap.get(s.id);
    return { santri: s, m: computeSantriMetrics(s, entries, year, month, haidDates) };
  });

  // Rata-rata kelas per hari untuk Mode 2 (bilah abu pembanding)
  let kelasAvg: { adab: number[]; ibadah: number[] } | undefined;
  if (mode === "m2") {
    const dim = new Date(year, month, 0).getDate();
    const sumA = new Array<number>(dim).fill(0);
    const sumI = new Array<number>(dim).fill(0);
    kelasAvg = { adab: sumA, ibadah: sumI };
    try {
      const per: { adab: number[]; ibadah: number[] }[] = allMetrics.map(({ santri: s }) => {
        const sEntries = entries.filter((e: MutabaahEntry) => e.santri_id === s.id);
        const mm = allMetrics.find((x) => x.santri.id === s.id)!.m;
        const d = buildIdnData(s, mm, sEntries, year, month);
        return { adab: d.dailyAdab, ibadah: d.dailyIbadah };
      });
      for (let d = 0; d < dim; d++) {
        let sa = 0, na = 0, si = 0, ni = 0;
        for (const q of per) {
          if (q.adab.length > d) { sa += q.adab[d]; na++; }
          si += q.ibadah[d] ?? 0; ni++;
        }
        sumA[d] = na > 0 ? sa / na : 0;
        sumI[d] = ni > 0 ? si / ni : 0;
      }
    } catch {
      /* abaikan rata-rata bila gagal */
    }
  }

  return (
    <div className="space-y-4">
      <CetakToolbar
        kelas={kelas}
        month={month}
        year={year}
        count={santri.length}
        label={label}
        mode={mode}
      />

      {allMetrics.map(({ santri: s, m }) => {
        const haidDates = haidMap.get(s.id);
        const sEntries = entries.filter((e: MutabaahEntry) => e.santri_id === s.id);
        return mode === "m2" ? (
          <RaportIdn
            key={s.id}
            santri={s}
            metrics={m}
            entries={sEntries}
            year={year}
            month={month}
            kelasAvg={kelasAvg}
          />
        ) : (
          <RaportSantri
            key={s.id}
            santri={s}
            metrics={m}
            entries={sEntries}
            year={year}
            month={month}
            haidDates={haidDates}
          />
        );
      })}
    </div>
  );
}