import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateSantri } from "@/lib/data";
import { santriUpdateSchema } from "@/lib/validations";

async function ensureAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await ensureAuth()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }
  const parsed = santriUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    const santri = await updateSantri(id, parsed.data);
    return NextResponse.json({ santri });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal menyimpan" },
      { status: 400 },
    );
  }
}
