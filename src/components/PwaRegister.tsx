"use client";

import { useEffect } from "react";

// Simpan prompt instalasi Chrome/Edge agar tombol "Pasang Aplikasi" bisa memanggilnya.
type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: DeferredPrompt | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getInstallState() {
  return {
    canInstall: deferred !== null,
    installed:
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari saat sudah berjalan sebagai aplikasi home screen
        (window.navigator as unknown as { standalone?: boolean }).standalone === true),
    prompt: async () => {
      if (!deferred) return "unavailable" as const;
      const d = deferred;
      deferred = null;
      emit();
      await d.prompt();
      const { outcome } = await d.userChoice;
      return outcome; // "accepted" | "dismissed"
    },
  };
}

export default function PwaRegister() {
  useEffect(() => {
    // daftar service worker (hanya production & saat browser mendukung)
    if ("serviceWorker" in navigator && !location.hostname.includes("localhost")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* instalasi SW gagal — aplikasi tetap jalan normal */
      });
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferred = e as DeferredPrompt;
      emit();
    };
    const onInstalled = () => {
      deferred = null;
      emit();
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
