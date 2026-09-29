import { listSantri, listEntries, listHaidForMonth } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel, bagianJakarta } from "@/lib/dates";
import RaportSantri from "@/components/RaportSantri";
import PrintButton from "@/components/PrintButton";
import type { Kelas, MutabaahEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const jkt = bagianJakarta();
  const month = Number(sp.month) || jkt.m;
  const year = Number(sp.year) || jkt.y;
  const kelas = sp.kelas ?? "Kelas 1";
  return {
    title: { absolute: `Raport ${kelas} — ${monthLabel(month, year)}` },
  };
}

export default async function CetakKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const jkt = bagianJakarta();
  const month = Number(sp.month) || jkt.m;
  const year = Number(sp.year) || jkt.y;
  const user = await getCurrentUser();
  const institusi = user?.institusi ?? "PA IMSHUS";
  const kelas = (sp.kelas ?? "Kelas 1") as Kelas;
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

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 px-2">
        <div>
          <a
            href={`/laporan?kelas=${encodeURIComponent(kelas)}&month=${month}&year=${year}`}
            className="text-sm text-muted hover:text-ink"
          >
            ← Kembali ke Laporan
          </a>
          <p className="mt-1 text-xs text-faint">
            {kelas} · {monthLabel(month, year)} · {santri.length} {label} · {santri.length * 2} halaman
          </p>
        </div>
        <PrintButton label={`Cetak ${santri.length} Raport`} />
      </div>

      {santri.map((s) => {
        const haidDates = haidMap.get(s.id);
        const sEntries = entries.filter((e: MutabaahEntry) => e.santri_id === s.id);
        const m = computeSantriMetrics(s, entries, year, month, haidDates);
        return (
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