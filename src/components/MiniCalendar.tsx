"use client";

import { useEffect, useRef } from "react";
import { daysInMonth, parseISO } from "@/lib/dates";

interface Props {
  year: number;
  month: number; // 1-12
  selected: string; // ISO
  today: string; // ISO
  marked: Set<string>; // tanggal dengan data
  haid?: Set<string>; // tanggal haid (santriwati terpilih)
  onSelect: (iso: string) => void;
  onClose: () => void;
}

const HARI = ["Se", "Su", "Ra", "Ka", "Ja", "Sa", "Ah"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Kalender grid 7 kolom (Senin awal). Tap hari -> pilih; titik = ada data. */
export default function MiniCalendar({
  year,
  month,
  selected,
  today,
  marked,
  haid,
  onSelect,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const dim = daysInMonth(year, month);
  const firstDow = (parseISO(`${year}-${pad(month)}-01`).getDay() + 6) % 7; // 0=Senin
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];

  return (
    <div
      ref={ref}
      className="card absolute left-0 top-full z-40 mt-2 w-[276px] p-3"
    >
      <div className="mb-1.5 grid grid-cols-7 text-center text-[10px] font-medium text-faint">
        {HARI.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d == null) return <span key={`e${i}`} />;
          const iso = `${year}-${pad(month)}-${pad(d)}`;
          const isSel = iso === selected;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              onClick={() => {
                onSelect(iso);
                onClose();
              }}
              className={
                "tnum relative grid size-9 place-items-center rounded-lg text-sm transition " +
                (isSel
                  ? "bg-accent font-semibold text-accent-fg"
                  : isToday
                    ? "bg-accent-soft font-semibold text-accent"
                    : "text-ink hover:bg-surface2")
              }
            >
              {d}
              {haid?.has(iso) && (
                <span
                  className={
                    "absolute bottom-1 size-1 rounded-full " +
                    (isSel ? "bg-white" : "bg-danger")
                  }
                />
              )}
              {marked.has(iso) && !haid?.has(iso) && !isSel && (
                <span className="absolute bottom-1 size-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
