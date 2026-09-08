import { NextResponse } from "next/server";
import { buildOrgCalendar, icalFilename } from "@/lib/ical";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = await readStore();
  if (!token || token !== store.icalToken) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = buildOrgCalendar(store);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icalFilename(store.churchName)}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
