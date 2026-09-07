import { NextResponse, type NextRequest } from "next/server";
import { createOffering, getOfferings } from "@/lib/cms/offerings";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { refreshOfferingPaths } from "@/lib/cms/offering-routes";
import { expirationSaveError } from "@/lib/cms/offering-expiration";
import { internalApiError } from "@/lib/security/api-response";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offerings = await getOfferings();
  return NextResponse.json({ offerings });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.title || !body?.type) {
    return NextResponse.json({ error: "El título y el tipo son obligatorios." }, { status: 400 });
  }

  const expirationError = expirationSaveError({
    expirationEnabled: body.expiration_enabled === true,
    expiresAt: body.expires_at,
    status: body.status,
  });
  if (expirationError) {
    return NextResponse.json({ error: expirationError }, { status: 400 });
  }

  try {
    const offering = await createOffering(body);
    refreshOfferingPaths(offering);
    return NextResponse.json({ offering });
  } catch (error) {
    return internalApiError(error, "No se pudo crear el offering.", 400);
  }
}
