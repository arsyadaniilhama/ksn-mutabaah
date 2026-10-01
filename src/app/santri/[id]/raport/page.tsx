import { notFound } from "next/navigation";
import { getSantri, listEntries, getHaidDates } from "@/lib/data";
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

  return (
    <RaportView
      santri={santri}
      metrics={m}
      entries={entries}
      year={year}
      month={month}
      haidDates={haidDates}
      initialMode={initialMode}
    />
  );
}