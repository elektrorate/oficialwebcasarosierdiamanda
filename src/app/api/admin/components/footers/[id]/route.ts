import { requireAdminApi } from "@/lib/auth/supabase-auth";
import type { FooterSiteContactDisplaySync } from "@/lib/cms/footer-contact-sync";
import { deleteFooterPermanently, getFooterById, moveFooterToTrash, restoreFooter, updateFooter } from "@/lib/cms/footers";
import {
  publishFooterEditorBundle,
  publishFooterEditorErrorMessage,
} from "@/lib/cms/publish-footer-editor";
import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function revalidateFooterViews() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/components/footers");
  revalidatePath("/admin/formularios");
  revalidatePath("/admin/settings");
}

function isContactDisplaySyncInput(value: unknown): value is FooterSiteContactDisplaySync {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.address === "string" && typeof v.mapUrl === "string";
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const item = await getFooterById((await ctx.params).id);
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ footer: item });
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const footerId = (await ctx.params).id;
    const body = (await request.json()) as Record<string, unknown>;
    const syncSiteContact = body.sync_site_contact === true;
    const contactSync = body.contact_sync;
    const contactForm = body.contact_form;
    const contactFormId = typeof body.contact_form_id === "string" ? body.contact_form_id : null;

    const {
      sync_site_contact: _s,
      contact_sync: _c,
      contact_form: _f,
      contact_form_id: _fid,
      ...footerData
    } = body;

    const hasContactForm =
      contactForm &&
      typeof contactForm === "object" &&
      contactFormId;

    if (hasContactForm) {
      const result = await publishFooterEditorBundle({
        footerId,
        footerData,
        syncSiteContact,
        contactSync: isContactDisplaySyncInput(contactSync) ? contactSync : undefined,
        contactFormId,
        contactFormPayload: contactForm as Record<string, unknown>,
      });
      revalidateFooterViews();
      return NextResponse.json({ footer: result.footer, form: result.form });
    }

    const item = await updateFooter(footerId, footerData);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (syncSiteContact && isContactDisplaySyncInput(contactSync)) {
      const { syncSiteContactDisplayFromFooterEditor } = await import("@/lib/cms/footer-contact-sync");
      await syncSiteContactDisplayFromFooterEditor(contactSync);
    }

    revalidateFooterViews();
    return NextResponse.json({ footer: item });
  } catch (err) {
    return NextResponse.json(
      { error: publishFooterEditorErrorMessage(err) },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (body.action === "duplicate") {
    return NextResponse.json({ error: "Solo puede existir un footer global en el sitio." }, { status: 409 });
  }
  if (body.action === "trash") {
    const item = await moveFooterToTrash(id);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    revalidateFooterViews();
    return NextResponse.json({ footer: item });
  }
  if (body.action === "restore") {
    const item = await restoreFooter(id);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    revalidateFooterViews();
    return NextResponse.json({ footer: item });
  }
  const item = await getFooterById(id);
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const ns = body.action === "publish" ? "published" : body.action === "archive" ? "archived" : body.action === "draft" ? "draft" : null;
  if (!ns) return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  const updated = await updateFooter(id, { ...item, status: ns });
  revalidateFooterViews();
  return NextResponse.json({ footer: updated });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ok = await deleteFooterPermanently((await ctx.params).id);
  if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  revalidateFooterViews();
  return NextResponse.json({ ok: true });
}
