import Link from "next/link";
import { listSantri } from "@/lib/data";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";

const KELAS_LIST: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

export default async function SantriPage() {
  const santri = await listSantri();
  const grouped = KELAS_LIST.map((k) => ({
    kelas: k,
    list: santri.filter((s) => s.kelas === k),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-slate-900">Daftar Santri</h1>
      {grouped.map((g) => (
        <section key={g.kelas}>
          <h2 className="mb-2 text-sm font-semibold text-slate-600">
            {g.kelas} <span className="text-slate-400">({g.list.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.list.map((s) => (
              <Link
                key={s.id}
                href={`/santri/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-brand-500 hover:bg-brand-50/40"
              >
                <span className="font-medium text-slate-800">{s.nama}</span>
                <span className="text-xs text-slate-400">NIS {s.nis}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
