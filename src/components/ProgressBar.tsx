import { klasifikasi } from "@/lib/metrics";

const fill: Record<string, string> = {
  tinggi: "bg-accent",
  sedang: "bg-warn",
  rendah: "bg-danger",
};

export default function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      className={"h-1.5 w-full overflow-hidden rounded-full bg-surface2 " + className}
    >
      <div
        className={"h-full rounded-full transition-all " + fill[klasifikasi(value)]}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
