import { klasifikasi } from "@/lib/metrics";

type CakraDatum = {
  id: number;
  nama: string;
  pct: number;
};

const COLORS: Record<string, string> = {
  tinggi: "#15803d",
  sedang: "#d97706",
  rendah: "#b91c1c",
};

function point(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function arcSegment(inner: number, outer: number, start: number, end: number) {
  const cx = 150;
  const cy = 150;
  const outerStart = point(cx, cy, outer, start);
  const outerEnd = point(cx, cy, outer, end);
  const innerEnd = point(cx, cy, inner, end);
  const innerStart = point(cx, cy, inner, start);
  const largeArc = end - start > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export default function CakraMutabaah({
  data,
  score,
  measured,
}: {
  data: CakraDatum[];
  score: number;
  measured: boolean;
}) {
  const gap = 1.8;
  const step = 360 / data.length;
  const center = measured ? `${score}%` : "—";

  return (
    <div className="report-cakra grid items-center gap-5 sm:grid-cols-[260px_1fr]">
      <div className="report-cakra-visual mx-auto w-full max-w-[260px]">
        <svg
          viewBox="0 0 300 300"
          role="img"
          aria-label={`Cakra Mutabaah, indeks rutinitas ${center}`}
          className="block w-full"
        >
          <circle cx="150" cy="150" r="137" fill="#f0fdf4" />
          <circle cx="150" cy="150" r="114" fill="none" stroke="#bbf7d0" strokeWidth="1" />
          <circle cx="150" cy="150" r="76" fill="#ffffff" stroke="#d1fae5" strokeWidth="1.5" />
          {data.map((item, index) => {
            const start = index * step + gap / 2;
            const end = (index + 1) * step - gap / 2;
            const level = klasifikasi(item.pct);
            return (
              <path
                key={item.id}
                d={arcSegment(84, 128, start, end)}
                fill={COLORS[level]}
                opacity={item.pct === 0 ? 0.25 : 1}
              />
            );
          })}
          <circle cx="150" cy="150" r="62" fill="#ffffff" stroke="#047857" strokeWidth="1.5" />
          <path d="M150 77v18M150 205v18M77 150h18M205 150h18" stroke="#059669" strokeWidth="1.5" />
          <path d="M98.4 98.4l12.7 12.7M188.9 188.9l12.7 12.7M201.6 98.4l-12.7 12.7M111.1 188.9l-12.7 12.7" stroke="#059669" strokeWidth="1.5" />
          <text x="150" y="142" textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="700" letterSpacing="1.6">
            INDEKS
          </text>
          <text x="150" y="171" textAnchor="middle" fill="#18181b" fontSize="31" fontWeight="700">
            {center}
          </text>
          <text x="150" y="190" textAnchor="middle" fill="#71717a" fontSize="8.5" letterSpacing="1.1">
            RUTINITAS
          </text>
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900">Cakra Mutabaah</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Setiap segmen mewakili satu amalan pada periode ini. Warna menunjukkan tingkat pencapaian tiap amalan.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
          <Legend color="#15803d" label="Tinggi" description="≥ 80%" />
          <Legend color="#d97706" label="Sedang" description="60–79%" />
          <Legend color="#b91c1c" label="Perlu bina" description="< 60%" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-200 pt-3 text-[9px] text-zinc-600 sm:grid-cols-3">
          {data.map((item, index) => (
            <div key={item.id} className="flex min-w-0 items-center gap-1.5">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[klasifikasi(item.pct)] }}
              />
              <span className="truncate">{index + 1}. {item.nama}</span>
              <span className="tnum ml-auto font-semibold text-zinc-900">{measured ? `${item.pct}%` : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, description }: { color: string; label: string; description: string }) {
  return (
    <div className="border-l-2 px-2" style={{ borderColor: color }}>
      <div className="font-semibold text-zinc-800">{label}</div>
      <div className="mt-0.5 text-zinc-500">{description}</div>
    </div>
  );
}
