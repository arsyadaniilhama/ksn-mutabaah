import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: c("--bg-canvas"),
        surface: c("--bg-surface"),
        surface2: c("--bg-surface-2"),
        line: c("--line"),
        "line-strong": c("--line-strong"),
        ink: c("--ink"),
        muted: c("--ink-muted"),
        faint: c("--ink-faint"),
        accent: {
          DEFAULT: c("--accent"),
          hover: c("--accent-hover"),
          fg: c("--accent-fg"),
          soft: c("--accent-soft"),
        },
        danger: { DEFAULT: c("--danger"), soft: c("--danger-soft") },
        warn: { DEFAULT: c("--warn"), soft: c("--warn-soft") },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
