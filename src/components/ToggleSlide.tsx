"use client";

import type { EntryStatus } from "@/types";

interface Props {
  value: EntryStatus | null;
  onChange: (next: EntryStatus | null) => void;
  disabled?: boolean;
}

/**
 * Slide toggle Ya/Tidak (binary). Netral bila value === null.
 * Tap sisi aktif lagi -> kembali netral (hapus nilai).
 */
export default function ToggleSlide({ value, onChange, disabled }: Props) {
  const set = (v: EntryStatus) => onChange(value === v ? null : v);

  return (
    <div
      className={
        "relative inline-flex select-none overflow-hidden rounded-full border border-line bg-surface2 text-xs font-semibold " +
        (disabled ? "opacity-50" : "")
      }
    >
      <span
        className={
          "toggle-thumb absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full " +
          (value === "done"
            ? "translate-x-full bg-accent"
            : value === "miss"
              ? "translate-x-0 bg-danger"
              : "translate-x-0 bg-transparent")
        }
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => set("miss")}
        aria-pressed={value === "miss"}
        className={
          "relative z-10 w-14 py-1.5 text-center transition-colors " +
          (value === "miss" ? "text-accent-fg" : "text-muted hover:text-ink")
        }
      >
        Tidak
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => set("done")}
        aria-pressed={value === "done"}
        className={
          "relative z-10 w-14 py-1.5 text-center transition-colors " +
          (value === "done" ? "text-accent-fg" : "text-muted hover:text-ink")
        }
      >
        Ya
      </button>
    </div>
  );
}
