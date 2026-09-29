import { NextResponse, type NextRequest } from "next/server";
import { expireDueOfferings } from "@/lib/cms/offerings";
import { refreshOfferingPaths } from "@/lib/cms/offering-routes";
import { isAuthorizedCronRequest } from "@/lib/security/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireDueOfferings();
  for (const offering of result.offerings) {
    refreshOfferingPaths(offering);
  }

  return NextResponse.json(result);
}
