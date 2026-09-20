"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { klasifikasi } from "@/lib/metrics";

const COLORS: Record<string, string> = {
  tinggi: "rgb(var(--accent))",
  sedang: "rgb(var(--warn))",
  rendah: "rgb(var(--danger))",
};

const REPORT_COLORS: Record<string, string> = {
  tinggi: "#15803d",
  sedang: "#d97706",
  rendah: "#dc2626",
};

interface Datum {
  id: number;
  nama: string;
  short: string;
  pct: number;
}

export default function PctBarChart({
  data,
  height = 288,
  report = false,
}: {
  data: { id: number; nama: string; pct: number }[];
  height?: number;
  report?: boolean;
}) {
  const rows: Datum[] = data.map((d) => ({
    ...d,
    short: d.nama.length > 12 ? d.nama.slice(0, 11) + "…" : d.nama,
  }));
  const colors = report ? REPORT_COLORS : COLORS;
  const gridStroke = report ? "#d4d4d8" : "rgb(var(--line))";
  const axisStroke = report ? "#a1a1aa" : "rgb(var(--line-strong))";
  const textFill = report ? "#52525b" : "rgb(var(--ink-faint))";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="short"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 9, fill: textFill }}
            stroke={axisStroke}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: textFill }}
            unit="%"
            stroke={axisStroke}
          />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Rutinitas"]}
            labelFormatter={(_, p) => (p?.[0]?.payload?.nama as string) ?? ""}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: `1px solid ${gridStroke}`,
              background: report ? "#ffffff" : "rgb(var(--bg-surface))",
              color: report ? "#18181b" : "rgb(var(--ink))",
            }}
            cursor={{ fill: report ? "#f4f4f5" : "rgb(var(--bg-surface-2) / 0.6)" }}
          />
          <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
            {rows.map((r) => (
              <Cell key={r.id} fill={colors[klasifikasi(r.pct)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
