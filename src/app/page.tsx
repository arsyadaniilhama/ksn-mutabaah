import Link from "next/link";
import { listSantri, listEntries } from "@/lib/data";
import { computeSantriMetrics } from "@/lib/metrics";
import { monthLabel } from "@/lib/dates";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

function toneFor(pct: number) {
  return pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad";
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [santri, entries] = await Promise.all([
    listSantri(),
    listEntries({ year, month }),
  ]);

  const metrics = santri.map((s) => computeSantriMetrics(s, entries, year, month));
  const avg = metrics.length
    ? Math.round(metrics.reduce((a, m) => a + m.indeksRutinitas, 0) / metrics.length)
    : 0;
  const sorted = [...metrics].sort((a, b) => b.indeksRutinitas - a.indeksRutinitas);
  const top = sorted.slice(0, 3);
  const perluPerhatian = sorted.filter((m) => m.indeksRutinitas < 50).slice(-3).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan bulan {monthLabel(month, year)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Santri" value={santri.length} />
        <StatCard label="Indeks Rata-rata" value={`${avg}%`} tone={toneFor(avg) as never} />
        <StatCard label="Sudah Diisi" value={metrics.filter((m) => m.totalPoin > 0).length} hint="santri punya entri" />
        <StatCard label="Perlu Perhatian" value={perluPerhatian.length} tone="bad" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Teraktif</h2>
          <ol className="space-y-1 text-sm">
            {top.map((m, i) => (
              <li key={m.santri_id} className="flex justify-between">
                <Link href={`/santri/${m.santri_id}`} className="hover:underline">
                  {i + 1}. {m.nama}
                </Link>
                <span className="font-semibold text-brand-600">{m.indeksRutinitas}%</span>
              </li>
            ))}
            {top.length === 0 && <li className="text-slate-400">Belum ada data.</li>}
          </ol>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Perlu Perhatian</h2>
          <ol className="space-y-1 text-sm">
            {perluPerhatian.map((m) => (
              <li key={m.santri_id} className="flex justify-between">
                <Link href={`/santri/${m.santri_id}`} className="hover:underline">
                  {m.nama}
                </Link>
                <span className="font-semibold text-red-600">{m.indeksRutinitas}%</span>
              </li>
            ))}
            {perluPerhatian.length === 0 && (
              <li className="text-slate-400">Semua di atas 50%. Bagus!</li>
            )}
          </ol>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Santri</th>
              <th className="px-4 py-2">Kelas</th>
              <th className="px-4 py-2 text-right">Indeks</th>
              <th className="px-4 py-2 text-right">Streak</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.santri_id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link href={`/santri/${m.santri_id}`} className="font-medium text-slate-800 hover:underline">
                    {m.nama}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-500">{m.kelas}</td>
                <td className="px-4 py-2 text-right font-semibold text-slate-700">{m.indeksRutinitas}%</td>
                <td className="px-4 py-2 text-right text-slate-500">{m.streak} hari</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
