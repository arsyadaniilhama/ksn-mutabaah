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
      <div className="print-area mx-auto max-w-[210mm] rounded-xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-lg font-bold text-white">
              K
            </span>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wide">
                Laporan Mutabaah Santri
              </h1>
              <p className="text-sm text-zinc-500">
                Pendidikan Islam IMSHUS — KSN
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">{monthLabel(m.bulan, m.tahun)}</div>
            <div className="text-zinc-500">Dokumen internal</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-1.5 text-sm">
          <div>
            <span className="text-zinc-500">Nama</span>{" "}
            <b className="ml-1">{m.nama}</b>
          </div>
          <div>
            <span className="text-zinc-500">Kelas</span>{" "}
            <b className="ml-1">{m.kelas}</b>
          </div>
          <div>
            <span className="text-zinc-500">NIS</span>{" "}
            <b className="ml-1 tnum">{santri.nis}</b>
          </div>
          <div>
            <span className="text-zinc-500">Periode</span>{" "}
            <b className="ml-1">{monthLabel(m.bulan, m.tahun)}</b>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "Indeks Rutinitas", v: `${m.indeksRutinitas}%` },
            { l: "Total Poin", v: m.totalPoin },
            { l: "Streak", v: `${m.streak} hr` },
            { l: "Total Rakaat", v: m.totalRakaat },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-zinc-200 bg-zinc-50 py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                {s.l}
              </div>
              <div className="tnum mt-0.5 text-lg font-bold">{s.v}</div>
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
            <tr className="bg-zinc-100 text-left">
              <th className="border border-zinc-200 px-2 py-1.5">No</th>
              <th className="border border-zinc-200 px-2 py-1.5">Amalan</th>
              <th className="border border-zinc-200 px-2 py-1.5 text-right">
                Tercapai
              </th>
              <th className="border border-zinc-200 px-2 py-1.5 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {m.kategori.map((k) => (
              <tr key={k.amalan_id}>
                <td className="tnum border border-zinc-200 px-2 py-1">{k.amalan_id}</td>
                <td className="border border-zinc-200 px-2 py-1">{k.nama}</td>
                <td className="tnum border border-zinc-200 px-2 py-1 text-right">
                  {k.done}/{k.total}
                  {k.rakaatTotal ? ` (${k.rakaatTotal} rk)` : ""}
                </td>
                <td className="tnum border border-zinc-200 px-2 py-1 text-right font-semibold">
                  {k.pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="mb-1 font-semibold">Catatan Musyrif</div>
            <div className="min-h-[72px] rounded-lg border border-zinc-300 p-2" />
          </div>
          <div className="text-center">
            <div className="leading-relaxed">
              {monthLabel(m.bulan, m.tahun)}
              <br />
              Mengetahui, Musyrif
            </div>
            <div className="mx-auto mt-14 w-44 border-t border-zinc-500 pt-1">
              (....................)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
