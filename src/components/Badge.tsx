type Tone = "neutral" | "accent" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
};

export default function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return <span className={"chip border " + tones[tone]}>{children}</span>;
}
