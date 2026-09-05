"use client";

import type { BinaryStatus } from "@/types";

interface Props {
  value: BinaryStatus | null;
  onChange: (next: BinaryStatus | null) => void;
  disabled?: boolean;
}

/**
 * Slide toggle Ya/Tidak (binary). Netral bila value === null.
 * Tap sisi aktif lagi -> kembali netral (hapus nilai).
 */
export default function ToggleSlide({ value, onChange, disabled }: Props) {
  const set = (v: BinaryStatus) => onChange(value === v ? null : v);

  return (
    <div
        className={
          "relative inline-flex w-full select-none overflow-hidden rounded-full border border-line bg-surface2 text-[10px] font-semibold xl:text-xs " +
          (disabled ? "opacity-50" : "")
        }
    >
      <span
        className={
          "toggle-thumb absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full " +
          (value === "done"
            ? "translate-x-0 bg-accent"
            : value === "miss"
              ? "translate-x-full bg-danger"
              : "translate-x-0 bg-transparent")
        }
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => set("done")}
        aria-pressed={value === "done"}
        className={
          "relative z-10 flex-1 py-0.5 text-center transition-colors xl:py-1.5 " +
          (value === "done" ? "text-accent-fg" : "text-muted hover:text-ink")
        }
      >
        Ya
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => set("miss")}
        aria-pressed={value === "miss"}
        className={
          "relative z-10 flex-1 py-0.5 text-center transition-colors xl:py-1.5 " +
          (value === "miss" ? "text-accent-fg" : "text-muted hover:text-ink")
        }
      >
        Tidak
      </button>
    </div>
  );
}
