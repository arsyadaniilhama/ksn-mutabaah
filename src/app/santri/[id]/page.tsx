import Link from "next/link";
import { notFound } from "next/navigation";
import { IconFilter as Filter, IconPdf as FilePdf } from "@tabler/icons-react";
import { getSantri, listEntries, getHaidDates } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel, bagianJakarta } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import PctBarChart from "@/components/PctBarChart";
import {
  IconCalendarCheck as CalendarCheck,
  IconFlame as Flame,
  IconGauge as Gauge,
  IconStack as Stack,
} from "@tabler/icons-react";

export const dynamic = "force-dynamic";

function toneFor(pct: number) {
  return pct >= 80 ? "accent" : pct >= 50 ? "warn" : "danger";
}

export default async function SantriDetailPage({
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
    <div className="space-y-6">
      <PageHeader title={santri.nama} description={`${santri.kelas} · NIS ${santri.nis} · ${monthLabel(month, year)}`}>
        <Link
          href={`/santri/${santri.id}/raport?month=${month}&year=${year}`}
          className="btn-primary"
        >
          <FilePdf size={16} stroke={1.75} /> Raport
        </Link>
      </PageHeader>

      <div className="card flex items-center gap-4 p-5">
        <Avatar name={santri.nama} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-ink">
            {santri.nama}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{santri.kelas}</Badge>
            <span className="tnum text-xs text-faint">NIS {santri.nis}</span>
            {m.haidCount > 0 && (
              <Badge tone="danger">
                {m.haidCount} hari haid · dihitung dari {m.hariTerhitung} hari
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Gauge}
          label="Indeks Rutinitas"
          value={m.terukur ? `${m.indeksRutinitas}%` : "—"}
          tone={toneFor(m.indeksRutinitas) as never}
          sub={
            m.terukur ? (
              <ProgressBar value={m.indeksRutinitas} />
            ) : (
              "seluruh hari berjalan adalah haid"
            )
          }
        />
        <KpiCard icon={CalendarCheck} label="Total Poin" value={m.totalPoin} sub="V + rakaat bulan ini" />
        <KpiCard icon={Flame} label="Streak Terbaik" value={`${m.streak} hari`} sub="hari lengkap berturut-turut" tone="warn" />
        <KpiCard icon={Stack} label="Total Rakaat" value={m.totalRakaat} sub="tahajjud · witir · dhuha · rawatib" />
      </div>

      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          % Rutinitas per Kategori
        </h2>
        <PctBarChart
          data={m.kategori.map((k) => ({ id: k.amalan_id, nama: k.nama, pct: k.pct }))}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
          <Filter size={15} stroke={1.75} className="text-faint" />
          <h2 className="text-sm font-semibold text-ink">Rincian Kategori</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              <th className="px-5 py-2.5 font-medium">Amalan</th>
              <th className="px-4 py-2.5 text-right font-medium">Tercapai</th>
              <th className="px-5 py-2.5 font-medium">Progres</th>
            </tr>
          </thead>
          <tbody>
            {m.kategori.map((k) => (
              <tr key={k.amalan_id} className="border-b border-line last:border-0 hover:bg-surface2/50">
                <td className="px-5 py-2.5 text-ink">{k.nama}</td>
                <td className="tnum px-4 py-2.5 text-right text-muted">
                  {k.done}/{k.total}
                  {k.rakaatTotal ? ` · ${k.rakaatTotal} rk` : ""}
                  {k.tepat != null ? ` · T${k.tepat} M${k.masbuq} S${k.sendiri}` : ""}
                </td>
                <td className="px-5 py-2.5">
                  {m.terukur ? (
                    <div className="flex items-center gap-2">
                      <ProgressBar value={k.pct} className="w-28" />
                      <span className="tnum w-9 text-right text-xs font-semibold text-ink">
                        {k.pct}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
