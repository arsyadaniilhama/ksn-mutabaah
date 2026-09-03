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
        className="h-8 w-8 rounded-lg bg-slate-100 text-lg font-bold text-slate-600 hover:bg-slate-200"
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
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const v = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
          onChange(v);
        }}
        className="h-8 w-14 rounded-lg border border-slate-300 text-center text-sm font-semibold outline-none focus:border-brand-500"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={inc}
        className="h-8 w-8 rounded-lg bg-brand-500 text-lg font-bold text-white hover:bg-brand-600"
      >
        +
      </button>
    </div>
  );
}
