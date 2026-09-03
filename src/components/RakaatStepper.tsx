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
    <div className={"inline-flex items-center gap-1 " + (disabled ? "opacity-50" : "")}>
      <button
        type="button"
        disabled={disabled}
        onClick={dec}
        aria-label="Kurangi"
        className="grid size-8 place-items-center rounded-lg bg-surface2 text-base font-bold text-muted transition hover:bg-line active:scale-95"
      >
        −
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
        className="tnum h-8 w-12 rounded-lg border border-line bg-surface text-center text-sm font-semibold text-ink outline-none focus:border-accent"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={inc}
        aria-label="Tambah"
        className="grid size-8 place-items-center rounded-lg bg-accent text-base font-bold text-accent-fg transition hover:bg-accent-hover active:scale-95"
      >
        +
      </button>
    </div>
  );
}
