import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Shell from "@/components/Shell";
import SetupNotice from "@/components/SetupNotice";
import ThemeProvider from "@/components/ThemeProvider";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mutabaah KSN", template: "%s · Mutabaah KSN" },
  description: "Pencatatan mutabaah harian santri PA IMSHUS",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  let email: string | null = null;
  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      email = data.user?.email ?? null;
    } catch {
      email = null;
    }
  }
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          {configured ? <Shell email={email}>{children}</Shell> : <SetupNotice />}
        </ThemeProvider>
      </body>
    </html>
  );
}
