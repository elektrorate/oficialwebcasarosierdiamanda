import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSettings, resetSettings, updateSettings } from "@/lib/cms/settings";
import { requireAdminApi } from "@/lib/auth/supabase-auth";
import { revalidatePublicRobots } from "@/lib/seo/revalidation";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const settings = await updateSettings(body);
  revalidatePath("/", "layout");
  revalidatePublicRobots();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  if (action === "reset") {
    const settings = await resetSettings();
    revalidatePath("/", "layout");
    revalidatePublicRobots();
    return NextResponse.json({ settings });
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}
