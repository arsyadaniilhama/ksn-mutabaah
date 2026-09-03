import Link from "next/link";
import { IconChevronRight as ChevronRight } from "@tabler/icons-react";
import { listSantri } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import type { Kelas } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Santri" };

const KELAS_LIST: Kelas[] = ["Kelas 1", "Kelas 2", "Kelas 3"];

export default async function SantriPage() {
  const santri = await listSantri();
  const grouped = KELAS_LIST.map((k) => ({
    kelas: k,
    list: santri.filter((s) => s.kelas === k),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daftar Santri"
        description={`${santri.length} santri aktif PA IMSHUS`}
      />

      {grouped.map((g) => (
        <section key={g.kelas}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            {g.kelas}
            <span className="chip bg-surface2 text-muted tnum">{g.list.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.list.map((s) => (
              <Link
                key={s.id}
                href={`/santri/${s.id}`}
                className="card group flex items-center gap-3 p-3 transition-colors hover:border-accent/40"
              >
                <Avatar name={s.nama} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">
                    {s.nama}
                  </span>
                  <span className="tnum block text-xs text-faint">NIS {s.nis}</span>
                </span>
                <ChevronRight
                  size={14}
                  stroke={1.75}
                  className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
