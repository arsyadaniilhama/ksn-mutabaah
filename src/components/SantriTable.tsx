"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
  IconSearch as Search,
  IconUsers as Users,
} from "@tabler/icons-react";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";

export interface SantriRow {
  id: string;
  nama: string;
  nis: number;
  kelas: string;
  indeks: number;
  streak: number;
  terukur?: boolean;
}

type SortKey = "nama" | "indeks" | "streak";
const KELAS = ["Semua", "Kelas 1", "Kelas 2", "Kelas 3"];
const PAGE_SIZE = 10;

interface Props {
  rows: SantriRow[];
  label?: string;
}

export default function SantriTable({ rows, label = "Santri" }: Props) {
  const [q, setQ] = useState("");
  const [kelas, setKelas] = useState("Semua");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "indeks",
    dir: -1,
  });
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter(
      (r) =>
        (kelas === "Semua" || r.kelas === kelas) &&
        (!needle ||
          r.nama.toLowerCase().includes(needle) ||
          String(r.nis).includes(needle)),
    );
    out = [...out].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      const cmp =
        typeof va === "string"
          ? va.localeCompare(String(vb))
          : (va as number) - (vb as number);
      return cmp * sort.dir;
    });
    return out;
  }, [rows, q, kelas, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const view = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setPage(0);
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: -1 },
    );
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sort.key !== col ? null : sort.dir === -1 ? (
      <ChevronDown size={12} stroke={2.5} />
    ) : (
      <ChevronUp size={12} stroke={2.5} />
    );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
        <div className="relative min-w-48 flex-1">
          <Search
            size={15}
            stroke={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Cari nama atau NIS…"
            className="input pl-9"
            aria-label="Cari santri"
          />
        </div>
        <div className="flex rounded-lg border border-line bg-canvas p-0.5">
          {KELAS.map((k) => (
            <button
              key={k}
              onClick={() => {
                setKelas(k);
                setPage(0);
              }}
              className={
                "rounded-md px-2.5 py-1 text-xs font-medium transition " +
                (k === kelas
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink")
              }
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-faint">
            <th className="px-4 py-2.5 font-medium">
              <button
                className="inline-flex items-center gap-1 hover:text-ink"
                onClick={() => toggleSort("nama")}
              >
                {label} <SortIcon col="nama" />
              </button>
            </th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Kelas</th>
            <th className="px-4 py-2.5 font-medium">
              <button
                className="inline-flex items-center gap-1 hover:text-ink"
                onClick={() => toggleSort("indeks")}
              >
                Indeks <SortIcon col="indeks" />
              </button>
            </th>
            <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">
              <button
                className="inline-flex items-center gap-1 hover:text-ink"
                onClick={() => toggleSort("streak")}
              >
                Streak <SortIcon col="streak" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {view.map((r) => (
            <tr
              key={r.id}
              className="border-b border-line last:border-0 transition-colors hover:bg-surface2/60"
            >
              <td className="px-4 py-2.5">
                <Link
                  href={`/santri/${r.id}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar name={r.nama} size="sm" />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-medium text-ink group-hover:text-accent">
                      {r.nama}
                    </span>
                    <span className="tnum block text-xs text-faint">
                      NIS {r.nis}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="hidden px-4 py-2.5 sm:table-cell">
                <Badge>{r.kelas}</Badge>
              </td>
              <td className="px-4 py-2.5">
                {r.terukur === false ? (
                  <span className="text-xs text-faint">—</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <ProgressBar value={r.indeks} className="w-20 sm:w-28" />
                    <span className="tnum text-xs font-semibold text-ink">
                      {r.indeks}%
                    </span>
                  </div>
                )}
              </td>
              <td className="tnum hidden px-4 py-2.5 text-right text-muted sm:table-cell">
                {r.streak} hari
              </td>
            </tr>
          ))}
          {view.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center">
                <Users size={28} stroke={1.5} className="mx-auto mb-2 text-faint" />
                <p className="text-sm font-medium text-muted">
                  Tidak ada {label.toLowerCase()} yang cocok
                </p>
                <p className="mt-1 text-xs text-faint">
                  Ubah kata kunci atau filter kelas.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
          <span className="tnum">
            {filtered.length} {label.toLowerCase()} · hal {safePage + 1}/{pages}
          </span>
          <div className="flex gap-1">
            <button
              className="btn-outline h-7 px-2.5 text-xs disabled:opacity-40"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Prev
            </button>
            <button
              className="btn-outline h-7 px-2.5 text-xs disabled:opacity-40"
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
