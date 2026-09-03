import ProgressBar from "@/components/ProgressBar";

interface Row {
  id: number;
  nama: string;
  pct: number;
}

export default function RutinitasBars({ rows }: { rows: Row[] }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3">
          <span className="w-44 shrink-0 truncate text-xs text-muted sm:w-52">
            {r.nama}
          </span>
          <ProgressBar value={r.pct} className="flex-1" />
          <span className="tnum w-9 shrink-0 text-right text-xs font-semibold text-ink">
            {r.pct}%
          </span>
        </li>
      ))}
    </ul>
  );
}
