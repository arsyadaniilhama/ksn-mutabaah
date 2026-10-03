"use client";

/**
 * Umpan balik haptic singkat ala aplikasi native.
 * - Android/Chrome & perangkat dengan API Vibration: getar beberapa ms.
 * - Desktop & iOS Safari (tidak mendukung): no-op aman, tanpa error.
 * - Hormati preferensi mengurangi animasi/gerakan.
 */
export function tapFeedback(pattern: number | number[] = 10) {
  if (typeof navigator === "undefined") return;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* abaikan — haptic bersifat opsional */
  }
}

/** Getar sukses: dua ketukan pendek. */
export const successFeedback = () => tapFeedback([12, 40, 18]);

/** Getar gagal: tiga ketukan dalam. */
export const errorFeedback = () => tapFeedback([40, 60, 40, 60, 60]);
