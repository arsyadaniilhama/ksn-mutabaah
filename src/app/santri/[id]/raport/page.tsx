import { notFound } from "next/navigation";
import { getSantri, listEntries, getHaidDates } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel, bagianJakarta } from "@/lib/dates";
import CakraMutabaah from "@/components/CakraMutabaah";
import ExportButtons from "@/components/ExportButtons";
import type { KategoriMetric } from "@/types";

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
  const sebutan = santri.institusi === "PI IMSHUS" ? "Santriwati" : "Santri";
  const tiles: { l: string; v: string | number }[] = [
    { l: "Indeks Rutinitas", v: m.terukur ? `${m.indeksRutinitas}%` : "—" },
    { l: "Total Poin", v: m.totalPoin },
    { l: "Total Rakaat", v: m.totalRakaat },
  ];
  if (m.haidCount > 0)
    tiles.push({ l: "Hari Dihitung", v: `${m.hariTerhitung}/${m.hariBerjalan}` });

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

        <div className="print-area report-document mx-auto max-w-[210mm] overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
          <div className="report-header px-6 pb-5 pt-6 lg:px-8 lg:pt-8">
            <div className="flex items-start justify-between gap-5">
              <div className="flex min-w-0 items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-imshus.png"
                  alt="Logo IMSHUS"
                  className="size-11 shrink-0 rounded-full bg-white p-0.5"
                />
                <div className="min-w-0">
                  <h1 className="text-base font-bold uppercase tracking-[0.14em] text-zinc-950 sm:text-lg">
                    Laporan Mutabaah {sebutan}
                  </h1>
                  <p className="mt-1 text-xs font-medium tracking-wide text-emerald-800">
                    Bagian Kesantrian IMSHUS
                  </p>
                </div>
              </div>
              <div className="shrink-0 border-l border-emerald-900/20 pl-4 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  Periode Laporan
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-900">
                  {monthLabel(m.bulan, m.tahun)}
                </p>
              </div>
            </div>
          </div>

          <div className="report-body px-6 pb-6 lg:px-8 lg:pb-8">
            <div className="report-identity grid grid-cols-1 gap-x-8 gap-y-2 px-4 py-3 text-sm sm:grid-cols-2">
              <Info label="Nama" value={m.nama} />
              <Info label="Kelas" value={m.kelas} />
              <Info label="NIS" value={santri.nis} numeric />
              <Info label="Periode" value={monthLabel(m.bulan, m.tahun)} />
            </div>

            <div
              className="report-metrics mt-5 grid gap-px overflow-hidden border border-zinc-200 bg-zinc-200 text-center"
              style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}
            >
              {tiles.map((s) => (
                <div key={s.l} className="bg-white px-2 py-3">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                    {s.l}
                  </div>
                  <div className="tnum mt-1 text-xl font-bold tracking-tight text-zinc-950">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            <section className="report-section mt-6">
              <div className="mb-3 flex items-end justify-between gap-4 border-b border-zinc-200 pb-2">
                <h2 className="text-sm font-bold text-zinc-900">Peta Capaian Amalan</h2>
                <span className="text-[10px] text-zinc-500">Cakra Mutabaah periode berjalan</span>
              </div>
              <CakraMutabaah
                score={m.indeksRutinitas}
                measured={m.terukur}
                data={m.kategori.map((k) => ({
                  id: k.amalan_id,
                  nama: k.nama,
                  pct: k.pct,
                }))}
              />
            </section>

            <section className="report-section mt-6">
              <div className="mb-3 flex items-end justify-between gap-4 border-b border-zinc-200 pb-2">
                <h2 className="text-sm font-bold text-zinc-900">Rincian Pencapaian</h2>
                <span className="text-[10px] text-zinc-500">Rekap periode berjalan</span>
              </div>
              <Tabel rows={m.kategori} terukur={m.terukur} haidCount={m.haidCount} />
            </section>

            <footer className="report-footer mt-6 flex items-center justify-between border-t border-zinc-200 pt-3 text-[9px] text-zinc-500">
              <span>Dokumen laporan mutabaah IMSHUS</span>
              <span>Diterbitkan untuk pemantauan pembinaan</span>
            </footer>
          </div>
        </div>
    </div>
  );
}

function Info({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string | number;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <span className={"min-w-0 font-semibold text-zinc-900 " + (numeric ? "tnum" : "")}>
        {value}
      </span>
    </div>
  );
}

function Tabel({
  rows,
  terukur,
  haidCount,
}: {
  rows: KategoriMetric[];
  terukur: boolean;
  haidCount?: number;
}) {
  return (
    <table className="report-table w-full border-collapse text-[10px]">
      <thead>
        <tr className="bg-emerald-950 text-center text-white">
          <th className="w-[6%] px-1.5 py-1.5 font-semibold">No</th>
          <th className="w-[40%] px-1.5 py-1.5 text-left font-semibold">Amalan</th>
          <th className="w-[12%] px-1.5 py-1.5 font-semibold">Tercapai</th>
          <th className="w-[30%] px-1.5 py-1.5 text-left font-semibold">Keterangan</th>
          <th className="w-[12%] px-1.5 py-1.5 font-semibold">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((k, index) => (
          <tr key={k.amalan_id} className={index % 2 ? "bg-zinc-50" : "bg-white"}>
            <td className="tnum border-b border-zinc-200 px-1.5 py-1 text-center text-zinc-500">
              {k.amalan_id}
            </td>
            <td className="border-b border-zinc-200 px-1.5 py-1 text-left font-medium text-zinc-900">
              {k.nama}
            </td>
            <td className="tnum border-b border-zinc-200 px-1.5 py-1 text-center text-zinc-700">
              {k.done}/{k.total}
            </td>
            <td className="border-b border-zinc-200 px-1.5 py-1 text-left text-zinc-500">
              {k.rakaatTotal ? `${k.rakaatTotal} rakaat` : ""}
              {k.tepat != null ? `Tepat ${k.tepat} · Masbuq ${k.masbuq} · Sendiri ${k.sendiri}` : ""}
            </td>
            <td className="tnum border-b border-zinc-200 px-1.5 py-1 text-center font-bold text-zinc-900">
              {terukur ? `${k.pct}%` : "—"}
            </td>
          </tr>
        ))}
        {haidCount != null && haidCount > 0 && (
          <tr className="bg-rose-50">
            <td className="px-1.5 py-1 text-center text-rose-700">—</td>
            <td className="px-1.5 py-1 text-left font-medium text-rose-900">Haid (dibebaskan)</td>
            <td className="tnum px-1.5 py-1 text-center text-rose-800">{haidCount} hari</td>
            <td className="px-1.5 py-1 text-left text-rose-700">
              tidak dihitung dalam persentase sholat/dzikir
            </td>
            <td className="px-1.5 py-1 text-center text-rose-700">—</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
