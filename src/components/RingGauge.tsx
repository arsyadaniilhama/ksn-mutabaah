import { klasifikasi } from "@/lib/metrics";

const stroke: Record<string, string> = {
  tinggi: "rgb(var(--accent))",
  sedang: "rgb(var(--warn))",
  rendah: "rgb(var(--danger))",
};

export default function RingGauge({
  value,
  size = 72,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          className="stroke-surface2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke[klasifikasi(value)]}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="tnum text-sm font-bold leading-none">{value}%</div>
        {label && <div className="mt-0.5 text-[9px] text-faint">{label}</div>}
      </div>
    </div>
  );
}
