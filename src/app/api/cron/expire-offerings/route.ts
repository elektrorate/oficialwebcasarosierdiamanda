import { NextResponse, type NextRequest } from "next/server";
import { expireDueOfferings } from "@/lib/cms/offerings";
import { refreshOfferingPaths } from "@/lib/cms/offering-routes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authorization = request.headers.get("authorization") ?? "";
    const provided = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!provided || provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await expireDueOfferings();
  for (const offering of result.offerings) {
    refreshOfferingPaths(offering);
  }

  return NextResponse.json(result);
}