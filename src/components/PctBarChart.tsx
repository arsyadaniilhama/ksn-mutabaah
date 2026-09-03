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

interface Datum {
  id: number;
  nama: string;
  short: string;
  pct: number;
}

export default function PctBarChart({
  data,
}: {
  data: { id: number; nama: string; pct: number }[];
}) {
  const rows: Datum[] = data.map((d) => ({
    ...d,
    short: d.nama.length > 12 ? d.nama.slice(0, 11) + "…" : d.nama,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 60 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgb(var(--line))"
          />
          <XAxis
            dataKey="short"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 9, fill: "rgb(var(--ink-faint))" }}
            stroke="rgb(var(--line-strong))"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "rgb(var(--ink-faint))" }}
            unit="%"
            stroke="rgb(var(--line-strong))"
          />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Rutinitas"]}
            labelFormatter={(_, p) => (p?.[0]?.payload?.nama as string) ?? ""}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid rgb(var(--line))",
              background: "rgb(var(--bg-surface))",
              color: "rgb(var(--ink))",
            }}
            cursor={{ fill: "rgb(var(--bg-surface-2) / 0.6)" }}
          />
          <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
            {rows.map((r) => (
              <Cell key={r.id} fill={COLORS[klasifikasi(r.pct)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
