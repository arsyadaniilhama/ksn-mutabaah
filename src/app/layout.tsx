import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Shell from "@/components/Shell";
import SetupNotice from "@/components/SetupNotice";
import ThemeProvider from "@/components/ThemeProvider";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mutabaah KSN", template: "%s · Mutabaah KSN" },
  description: "Pencatatan mutabaah harian santri PA IMSHUS & santriwati PI IMSHUS",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  const user = configured ? await getCurrentUser().catch(() => null) : null;
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          {configured ? (
            <Shell email={user?.email ?? null} institusi={user?.institusi ?? null}>
              {children}
            </Shell>
          ) : (
            <SetupNotice />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
