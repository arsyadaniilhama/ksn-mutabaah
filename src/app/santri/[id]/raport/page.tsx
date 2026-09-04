import { notFound } from "next/navigation";
import { getSantri, listEntries } from "@/lib/data";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel } from "@/lib/dates";
import PctBarChart from "@/components/PctBarChart";
import ExportButtons from "@/components/ExportButtons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raport" };

export default async function RaportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const santri = await getSantri(id);
  if (!santri) notFound();

  const entries = await listEntries({ year, month, santriId: santri.id });
  const m = computeSantriMetrics(santri, entries, year, month);

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

      {/* Dokumen: selalu light agar konsisten saat dicetak */}
      <div className="print-area mx-auto max-w-[210mm] rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm lg:p-8">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-imshus.png"
              alt="Logo IMSHUS"
              className="size-10 shrink-0 rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wide">
                Laporan Mutabaah Santri
              </h1>
              <p className="text-sm text-zinc-500">
                Bagian Kesantrian IMSHUS
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">{monthLabel(m.bulan, m.tahun)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">Nama</span>
            <b>{m.nama}</b>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">Kelas</span>
            <b>{m.kelas}</b>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">NIS</span>
            <b className="tnum">{santri.nis}</b>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 text-zinc-500">Periode</span>
            <b>{monthLabel(m.bulan, m.tahun)}</b>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Indeks Rutinitas", v: `${m.indeksRutinitas}%` },
            { l: "Total Poin", v: m.totalPoin },
            { l: "Streak", v: `${m.streak} hr` },
            { l: "Total Rakaat", v: m.totalRakaat },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-zinc-200 bg-zinc-50 py-2">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">
                {s.l}
              </div>
              <div className="tnum mt-0.5 text-base font-bold">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="mb-1 text-sm font-semibold">
            Persentase Rutinitas per Amalan
          </h2>
          <PctBarChart
            data={m.kategori.map((k) => ({
              id: k.amalan_id,
              nama: k.nama,
              pct: k.pct,
            }))}
          />
        </div>

        <table className="mt-4 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-100 text-center">
              <th className="border border-zinc-200 px-2 py-1.5">No</th>
              <th className="border border-zinc-200 px-2 py-1.5">Amalan</th>
              <th className="border border-zinc-200 px-2 py-1.5">Tercapai</th>
              <th className="border border-zinc-200 px-2 py-1.5">%</th>
            </tr>
          </thead>
          <tbody>
            {m.kategori.map((k) => (
              <tr key={k.amalan_id}>
                <td className="tnum border border-zinc-200 px-2 py-1 text-center">
                  {k.amalan_id}
                </td>
                <td className="border border-zinc-200 px-2 py-1 text-left">{k.nama}</td>
                <td className="tnum border border-zinc-200 px-2 py-1 text-center">
                  {k.done}/{k.total}
                  {k.rakaatTotal ? ` (${k.rakaatTotal} rk)` : ""}
                  {k.tepat != null ? ` · T${k.tepat} M${k.masbuq} S${k.sendiri}` : ""}
                </td>
                <td className="tnum border border-zinc-200 px-2 py-1 text-center font-semibold">
                  {k.pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
