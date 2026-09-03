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
  const set = (v: EntryStatus) =>
    onChange(value === v ? null : v);

  return (
    <div
      className={
        "relative inline-flex select-none overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold " +
        (disabled ? "opacity-50" : "")
      }
    >
      <span
        className={
          "toggle-thumb absolute inset-y-0 w-1/2 rounded-full transition " +
          (value === "done"
            ? "translate-x-full bg-brand-500"
            : value === "miss"
              ? "translate-x-0 bg-red-400"
              : "translate-x-0 bg-transparent")
        }
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => set("miss")}
        className={
          "relative z-10 w-14 py-1.5 text-center transition " +
          (value === "miss" ? "text-white" : "text-slate-500")
        }
      >
        Tidak
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => set("done")}
        className={
          "relative z-10 w-14 py-1.5 text-center transition " +
          (value === "done" ? "text-white" : "text-slate-500")
        }
      >
        Ya
      </button>
    </div>
  );
}
