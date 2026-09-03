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
  tinggi: "#1f7a4d",
  sedang: "#f59e0b",
  rendah: "#ef4444",
};

interface Datum {
  id: number;
  nama: string;
  short: string;
  pct: number;
}

export default function PctBarChart({ data }: { data: { id: number; nama: string; pct: number }[] }) {
  const rows: Datum[] = data.map((d) => ({
    ...d,
    short: d.nama.length > 12 ? d.nama.slice(0, 11) + "…" : d.nama,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="short"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 9 }}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Rutinitas"]}
            labelFormatter={(_, p) => (p?.[0]?.payload?.nama as string) ?? ""}
            contentStyle={{ fontSize: 12 }}
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
