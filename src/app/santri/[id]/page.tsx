import Link from "next/link";
import { notFound } from "next/navigation";
import { getSantri, listEntries } from "@/lib/data";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel } from "@/lib/dates";
import StatCard from "@/components/StatCard";
import PctBarChart from "@/components/PctBarChart";

export const dynamic = "force-dynamic";

function toneFor(pct: number) {
  return pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad";
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
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const santri = await getSantri(id);
  if (!santri) notFound();

  const entries = await listEntries({ year, month, santriId: santri.id });
  const m = computeSantriMetrics(santri, entries, year, month);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{santri.nama}</h1>
          <p className="text-sm text-slate-500">
            {santri.kelas} · NIS {santri.nis} · {monthLabel(month, year)}
          </p>
        </div>
        <Link
          href={`/santri/${santri.id}/raport?month=${month}&year=${year}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Lihat Raport
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Indeks Rutinitas" value={`${m.indeksRutinitas}%`} tone={toneFor(m.indeksRutinitas) as never} />
        <StatCard label="Total Poin" value={m.totalPoin} />
        <StatCard label="Streak" value={`${m.streak} hari`} />
        <StatCard label="Total Rakaat" value={m.totalRakaat} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">% Rutinitas per Kategori</h2>
        <PctBarChart data={m.kategori.map((k) => ({ id: k.amalan_id, nama: k.nama, pct: k.pct }))} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Amalan</th>
              <th className="px-4 py-2 text-right">Tercapai</th>
              <th className="px-4 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {m.kategori.map((k) => (
              <tr key={k.amalan_id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-700">{k.nama}</td>
                <td className="px-4 py-2 text-right text-slate-500">
                  {k.done}/{k.total}
                  {k.rakaatTotal ? ` · ${k.rakaatTotal} rakaat` : ""}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-700">{k.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
