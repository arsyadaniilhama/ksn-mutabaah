"use client";

interface Props {
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
  max?: number;
}

/** Stepper angka cepat untuk amalan bertipe rakaat. null/0 = belum. */
export default function RakaatStepper({ value, onChange, disabled, max = 99 }: Props) {
  const n = value ?? 0;
  const dec = () => onChange(Math.max(0, n - 1) || null);
  const inc = () => onChange(Math.min(max, n + 1));

  return (
    <div className={"flex w-full items-center justify-between gap-1 " + (disabled ? "opacity-50" : "")}>
      <button
        type="button"
        disabled={disabled}
        onClick={dec}
        aria-label="Kurangi"
        className="grid size-7 place-items-center rounded-lg bg-surface2 text-sm font-bold text-muted transition hover:bg-line active:scale-95 lg:size-6 xl:size-8 xl:text-base"
      >
        âˆ’
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        disabled={disabled}
        value={value ?? ""}
        placeholder="0"
        aria-label="Jumlah rakaat"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const v = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
          onChange(v);
        }}
        className="tnum h-7 w-9 rounded-lg border border-line bg-surface text-center text-[11px] font-semibold text-ink outline-none focus:border-accent lg:h-6 xl:h-8 xl:w-12 xl:text-sm"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={inc}
        aria-label="Tambah"
        className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg transition hover:bg-accent-hover active:scale-95 lg:size-6 xl:size-8 xl:text-base"
      >
        +
      </button>
    </div>
  );
}
