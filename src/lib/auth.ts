import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CurrentUser {
  id: string;
  email: string;
  institusi: string;
  role: string;
}

/** Session user + profile (institusi). Null bila belum login. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  let institusi = "PA IMSHUS";
  let role = "admin";
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
  } catch {
    // profile belum ada -> pakai default
  }

  return { id: user.id, email: user.email, institusi, role };
}
