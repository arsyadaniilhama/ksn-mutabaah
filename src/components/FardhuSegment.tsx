"use client";

import { FARDHU_OPTIONS } from "@/lib/amalan";
import type { FardhuStatus } from "@/types";

interface Props {
  value: FardhuStatus | null;
  onChange: (next: FardhuStatus | null) => void;
  disabled?: boolean;
}

const activeBg: Record<FardhuStatus, string> = {
  tepat: "bg-accent text-accent-fg",
  masbuq: "bg-warn text-white",
  sendiri: "bg-danger text-white",
};

/**
 * Segmented 3 pilihan untuk sholat fardhu: Tepat Waktu / Masbuq / Sendiri.
 * Tap opsi aktif lagi -> kembali netral (hapus nilai).
 */
export default function FardhuSegment({ value, onChange, disabled }: Props) {
  const set = (v: FardhuStatus) => onChange(value === v ? null : v);

  return (
    <div
      role="radiogroup"
      className={
        "inline-flex select-none gap-0.5 rounded-full border border-line bg-surface2 p-0.5 text-[10px] font-semibold md:text-[11px] " +
        (disabled ? "opacity-50" : "")
      }
    >
      {FARDHU_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => set(o.value)}
            className={
              "rounded-full px-2.5 py-1 whitespace-nowrap transition-colors md:px-2.5 " +
              (active ? activeBg[o.value] : "text-muted hover:text-ink")
            }
          >
            <span className="md:hidden">{o.short}</span>
            <span className="hidden md:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
