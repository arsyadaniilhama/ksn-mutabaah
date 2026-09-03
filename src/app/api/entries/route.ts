import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDayValues, upsertEntries } from "@/lib/data";
import { bulkUpsertSchema } from "@/lib/validations";

async function ensureAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function GET(request: Request) {
  if (!(await ensureAuth()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const santriId = searchParams.get("santri_id");
  const date = searchParams.get("date");
  if (!santriId || !date)
    return NextResponse.json({ error: "santri_id & date wajib" }, { status: 400 });

  const values = await getDayValues(santriId, date);
  return NextResponse.json({ values });
}

export async function POST(request: Request) {
  if (!(await ensureAuth()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body tidak valid" }, { status: 400 });
  }

  const parsed = bulkUpsertSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    await upsertEntries(parsed.data.entries);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "gagal menyimpan" },
      { status: 500 },
    );
  }
}
