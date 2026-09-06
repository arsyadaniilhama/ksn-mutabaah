import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSantri } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { santriCreateSchema } from "@/lib/validations";

async function ensureAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function POST(request: Request) {
  const cu = await getCurrentUser();
  if (!cu) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }
  const parsed = santriCreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    const santri = await createSantri({ ...parsed.data, institusi: cu.institusi });
    return NextResponse.json({ santri });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal menyimpan" },
      { status: 400 },
    );
  }
}
