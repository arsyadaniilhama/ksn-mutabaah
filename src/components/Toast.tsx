"use client";

import { useEffect } from "react";
import {
  IconCircleCheck as CircleCheck,
  IconCircleX as CircleX,
} from "@tabler/icons-react";

interface Props {
  message: string | null;
  tone?: "ok" | "err";
  onDone: () => void;
}

export default function Toast({ message, tone = "ok", onDone }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div
        className={
          "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg " +
          (tone === "ok"
            ? "bg-ink text-canvas"
            : "bg-danger text-white")
        }
      >
        {tone === "ok" ? <CircleCheck size={16} /> : <CircleX size={16} />}
        {message}
      </div>
    </div>
  );
}
