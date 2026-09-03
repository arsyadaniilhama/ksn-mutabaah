export default function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const cls =
    size === "sm"
      ? "size-7 text-[11px]"
      : size === "lg"
        ? "size-11 text-base"
        : "size-9 text-xs";
  return (
    <span
      aria-hidden
      className={
        "inline-grid shrink-0 select-none place-items-center rounded-full bg-accent-soft font-semibold text-accent " +
        cls
      }
    >
      {initials}
    </span>
  );
}
