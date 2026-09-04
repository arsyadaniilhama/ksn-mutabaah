import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDayProgress } from "@/lib/data";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date wajib" }, { status: 400 });

  const progress = await getDayProgress(date);
  return NextResponse.json({ progress });
}
