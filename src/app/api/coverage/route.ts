import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonthCoverage } from "@/lib/data";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month)
    return NextResponse.json({ error: "year & month wajib" }, { status: 400 });

  const dates = await getMonthCoverage(year, month);
  return NextResponse.json({ dates });
}
