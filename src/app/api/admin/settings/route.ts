import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getSettings,
  resetSettings,
  SettingsPersistenceError,
  updateSettings,
} from "@/lib/cms/settings";
import { invalidateSettingsCaches } from "@/lib/cms/settings-cache";
import { validateSettingsPayload } from "@/lib/cms/settings-schema";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el cuerpo de la petición." },
      { status: 400 },
    );
  }

  const validation = validateSettingsPayload(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Revisa los campos marcados antes de guardar.", errors: validation.errors },
      { status: 422 },
    );
  }

  try {
    const result = await updateSettings(validation.value);

    // Las cachés solo se invalidan cuando el guardado ha sido real.
    invalidateSettingsCaches();
    revalidatePath("/", "layout");
    revalidatePublicRobots();

    return NextResponse.json({ settings: result.settings, persisted: result.write });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (error instanceof SettingsPersistenceError) {
      return NextResponse.json(
        {
          error: error.message,
          saved: error.saved,
          failed: error.failed,
          partial: error.saved.length > 0,
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json().catch(() => ({})) as { action?: string };
  if (action === "reset") {
    try {
      const result = await resetSettings();
      invalidateSettingsCaches();
      revalidatePath("/", "layout");
      revalidatePublicRobots();
      return NextResponse.json({ settings: result.settings, persisted: result.write });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error instanceof SettingsPersistenceError) {
        return NextResponse.json(
          { error: error.message, saved: error.saved, failed: error.failed, partial: error.saved.length > 0 },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "No se pudieron restaurar los valores iniciales." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}
