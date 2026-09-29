import { notFound } from "next/navigation";
import { getSantri, listEntries, getHaidDates } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel, bagianJakarta } from "@/lib/dates";
import RaportSantri from "@/components/RaportSantri";
import ExportButtons from "@/components/ExportButtons";

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
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
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

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <a
          href={`/santri/${santri.id}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← Kembali ke detail
        </a>
        <ExportButtons santriId={santri.id} month={month} year={year} />
      </div>

      <RaportSantri
        santri={santri}
        metrics={m}
        entries={entries}
        year={year}
        month={month}
        haidDates={haidDates}
      />
    </div>
  );
}