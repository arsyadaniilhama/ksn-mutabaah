interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}

const toneMap: Record<string, string> = {
  default: "text-slate-900",
  good: "text-brand-600",
  warn: "text-amber-600",
  bad: "text-red-600",
};

export default function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={"mt-1 text-2xl font-bold " + toneMap[tone]}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
