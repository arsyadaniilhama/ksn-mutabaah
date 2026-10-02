import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const INSTITUSI_COOKIE = "ksn-institusi";
export const INSTITUSI_VALUES = ["PA IMSHUS", "PI IMSHUS"] as const;

export interface CurrentUser {
  id: string;
  email: string;
  /** Institusi AKTIF (superadmin bisa berpindah via cookie; admin biasa = institusi profil). */
  institusi: string;
  role: string;
  isSuperadmin: boolean;
}

/** Cache profil in-memory (per instance, TTL 30 dtk) -> hemat 1 query per request. */
const profileCache = new Map<string, { institusi: string; role: string; at: number }>();
const PROFILE_TTL_MS = 30_000;

/** Session user + profile (institusi). Null bila belum login. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  let institusi = "PA IMSHUS";
  let role = "admin";
  const cached = profileCache.get(user.id);
  if (cached && Date.now() - cached.at < PROFILE_TTL_MS) {
    institusi = cached.institusi;
    role = cached.role;
  } else {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role, institusi")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        institusi = profile.institusi ?? institusi;
        role = profile.role ?? role;
      }
      profileCache.set(user.id, { institusi, role, at: Date.now() });
    } catch {
      // profile belum ada -> pakai default
    }
  }

  // Superadmin: institusi aktif bisa dipilih via cookie (PA/PI). Admin biasa: tetap milik profilnya.
  const isSuperadmin = role === "superadmin";
  let activeInstitusi = institusi;
  if (isSuperadmin) {
    const cookieStore = await cookies();
    const requested = cookieStore.get(INSTITUSI_COOKIE)?.value;
    if (requested === "PA IMSHUS" || requested === "PI IMSHUS") activeInstitusi = requested;
  }

  return { id: user.id, email: user.email, institusi: activeInstitusi, role, isSuperadmin };
}
