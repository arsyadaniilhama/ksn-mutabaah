"use client";

import { useMemo, useState } from "react";
import { IconCircleCheck as CircleCheck, IconSearch as Search } from "@tabler/icons-react";
import Avatar from "@/components/Avatar";

export interface SantriListItem {
  id: string;
  nama: string;
  nis: number;
  filled: number; // 0..19
}

interface Props {
  items: SantriListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function SantriList({ items, selectedId, onSelect }: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (s) => s.nama.toLowerCase().includes(needle) || String(s.nis).includes(needle),
    );
  }, [items, q]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative mb-2 shrink-0">
        <Search
          size={15}
          stroke={1.75}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama / NIS…"
          aria-label="Cari santri"
          className="input pl-9"
        />
      </div>
      <ul className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1 pb-2">
        {filtered.map((s) => {
          const active = s.id === selectedId;
          const complete = s.filled >= 19;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                className={
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition " +
                  (active
                    ? "border-accent/50 bg-accent-soft"
                    : "border-transparent hover:bg-surface2")
                }
              >
                <Avatar name={s.nama} size="sm" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span
                    className={
                      "block truncate text-sm font-medium " +
                      (active ? "text-accent" : "text-ink")
                    }
                  >
                    {s.nama}
                  </span>
                  <span className="tnum block text-xs text-faint">NIS {s.nis}</span>
                </span>
                {complete ? (
                  <CircleCheck size={18} className="shrink-0 text-accent" />
                ) : (
                  <span className="tnum chip shrink-0 bg-surface2 text-muted">
                    {s.filled}/19
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-faint">
            Tidak ada santri cocok.
          </li>
        )}
      </ul>
    </div>
  );
}
