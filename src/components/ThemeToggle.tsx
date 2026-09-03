"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMoon as Moon, IconSun as Sun } from "@tabler/icons-react";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return <button aria-label="Ganti tema" className="btn-ghost size-9 p-0" />;

  const dark = resolvedTheme === "dark";
  return (
    <button
      aria-label="Ganti tema"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={
        compact
          ? "btn-ghost size-9 shrink-0 p-0"
          : "btn-ghost size-9 shrink-0 p-0"
      }
    >
      {dark ? <Sun size={18} stroke={1.75} /> : <Moon size={18} stroke={1.75} />}
    </button>
  );
}
