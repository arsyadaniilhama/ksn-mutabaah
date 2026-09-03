import type { Metadata } from "next";
import Shell from "@/components/Shell";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutabaah KSN",
  description: "Pencatatan mutabaah harian santri PA IMSHUS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  return (
    <html lang="id">
      <body>{configured ? <Shell>{children}</Shell> : <SetupNotice />}</body>
    </html>
  );
}
