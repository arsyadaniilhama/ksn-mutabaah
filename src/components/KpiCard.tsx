import type { ElementType } from "react";

interface Props {
  icon: ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "accent" | "warn" | "danger";
  right?: React.ReactNode;
}

const iconTone: Record<string, string> = {
  default: "bg-surface2 text-muted",
  accent: "bg-accent-soft text-accent",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

export default function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  right,
}: Props) {
  return (
    <div className="card flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={
              "grid size-8 shrink-0 place-items-center rounded-lg " + iconTone[tone]
            }
          >
            <Icon size={17} />
          </span>
          <span className="truncate text-sm font-medium text-muted">{label}</span>
        </div>
        <div className="tnum mt-3 text-2xl font-semibold leading-none text-ink">
          {value}
        </div>
        {sub && <div className="mt-2 text-xs text-faint">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
