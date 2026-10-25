"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getEditableCanvas, getMyCompany, getPlanForUser } from "@/lib/auth";
import {
  blankCanvasContent,
  defaultCanvasContent,
  extractSearchText,
  goalNodes,
  isContentTooLarge,
  limitWidgets,
  parseCanvasContent,
} from "@/lib/canvas/content";
import { publishContent, unpublishCanvasById } from "@/lib/canvas/publishing";
import { getDraftContent, getVersionContentForEditor } from "@/lib/canvas/queries";
import { planAllowsWidget, PLANS, type Plan, type PlanId } from "@/lib/plans";
import { formText, slugify } from "@/lib/utils";
import type { CanvasContent } from "@/lib/canvas/types";
import type { ActionResult, Canvas, CanvasVersion } from "@/lib/types";

/**
 * ════════════════════════════════════════════════════════════════
 *  CANVAS-ACTIONS – allt som ändrar en canvas.
 *  Varje funktion börjar med en behörighetskontroll på servern.
 * ════════════════════════════════════════════════════════════════
 */

const NOT_ALLOWED: ActionResult = { ok: false, error: "You can't edit this canvas.", code: "forbidden" };


// ── Skapa ────────────────────────────────────────────────────────

export async function createCanvas(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/create");

  const company = await getMyCompany();
  if (!company) redirect("/settings/company?welcome=1");

  const title = formText(form, "title") ?? "Untitled canvas";
  const supabase = await createClient();

  // Plangräns: hur många canvas får man ha?
  const { plan } = await getPlanForUser(user.id);
  const { count } = await supabase
    .from("canvases")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id);

  if ((count ?? 0) >= plan.limits.maxCanvases) {
    return {
      ok: false,
      code: "upgrade_required",
      error: `Your ${plan.name} plan allows ${plan.limits.maxCanvases} canvas. Upgrade or delete an existing one.`,
    };
  }

  const slug = await uniqueCanvasSlug(company.id, slugify(title) || "canvas");

  const { data: canvas, error } = await supabase
    .from("canvases")
    .insert({ company_id: company.id, title, slug, visible: true })
    .select("id")
    .single();

  if (error || !canvas) return { ok: false, error: "Could not create the canvas. Try again." };

  await supabase.from("canvas_drafts").insert({ canvas_id: canvas.id, content: defaultCanvasContent() });

  redirect(`/editor/${canvas.id}`);
}

/** "Page 4" – första lediga numret, så att två sidor aldrig får samma namn. */
function nextPageTitle(existingTitles: string[]): string {
  const taken = new Set(existingTitles);
  let n = existingTitles.length + 1;
  while (taken.has(`Page ${n}`)) n++;
  return `Page ${n}`;
}

/** "roadmap" → "roadmap-2" om "roadmap" redan finns hos företaget. */
async function uniqueCanvasSlug(companyId: string, base: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("canvases").select("slug").eq("company_id", companyId).like("slug", `${base}%`);

  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}


// ── Spara utkast (autosave) ──────────────────────────────────────

export async function saveDraft(canvasId: string, content: CanvasContent): Promise<ActionResult> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const parsed = limitWidgets(parseCanvasContent(content));
  if (isContentTooLarge(parsed)) return { ok: false, error: "The canvas is too large to save." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("canvas_drafts")
    .upsert({ canvas_id: canvasId, content: parsed });

  return error ? { ok: false, error: "Saving failed." } : { ok: true };
}


// ── Titel / beskrivning / slug ───────────────────────────────────

export async function updateCanvasDetails(canvasId: string, form: FormData): Promise<ActionResult> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const title = formText(form, "title");
  const slug = slugify(formText(form, "slug") ?? "");
  if (!title) return { ok: false, error: "Title is required." };
  if (!slug) return { ok: false, error: "URL name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("canvases")
    .update({ title, slug, description: formText(form, "description") })
    .eq("id", canvasId);

  if (error?.code === "23505") return { ok: false, error: "That URL name is already used by another canvas." };
  if (error) return { ok: false, error: "Could not save." };

  revalidatePath(`/c/${access.company.slug}`);
  return { ok: true };
}


// ── Publicera / avpublicera ──────────────────────────────────────

/**
 * Publish = gör det man ser i editorn till det besökarna ser:
 *   1. Den här sidans utkast publiceras (om den är markerad som synlig).
 *   2. Ögonen i sidmenyn verkställs för ALLA sidor: nyss synliga sidor
 *      publiceras, nyss dolda sidor avpubliceras (innehållet finns kvar).
 */
export async function publishCanvas(canvasId: string): Promise<ActionResult<{ url: string | null }>> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const { canvas, company, plan, user } = access;
  const supabase = await createClient();
  const { data } = await supabase.from("canvases").select("*").eq("company_id", company.id);
  const pages = (data ?? []) as Canvas[];

  // 1. Ryms alla synliga sidor i planen?
  const willBePublic = pages.filter((page) => page.visible);
  if (willBePublic.length > plan.limits.maxPublishedCanvases) {
    return { ok: false, code: "upgrade_required", error: publishLimitMessage(plan, willBePublic.length) };
  }

  // 2. Vilka sidor ska få nytt innehåll, och vilka ska döljas?
  const toPublish = willBePublic.filter((page) => page.id === canvasId || !page.published_version_id);
  const toHide = pages.filter((page) => !page.visible && page.published_version_id);

  // 3. Används bara widgets som ingår i planen?
  const drafts = await Promise.all(toPublish.map(async (page) => ({ page, content: await getDraftContent(page.id) })));
  for (const { page, content } of drafts) {
    const blocked = firstBlockedWidget(content, plan.id);
    if (blocked) {
      return {
        ok: false,
        code: "upgrade_required",
        error: `"${page.title}" uses the ${blocked} widget, which is part of ${PLANS.enterprise.name}. Remove it or upgrade.`,
      };
    }
  }

  // 4. Verkställ
  for (const { page, content } of drafts) {
    await publishContent({ canvasId: page.id, userId: user.id, content, searchText: extractSearchText(content) });
  }
  for (const page of toHide) {
    await unpublishCanvasById(page.id);
  }

  revalidatePath(`/c/${company.slug}`, "layout");
  const url = canvas.visible ? `/c/${company.slug}/${canvas.slug}` : null;
  return { ok: true, data: { url } };
}

function publishLimitMessage(plan: Plan, wanted: number): string {
  if (plan.limits.maxPublishedCanvases === 0) return "Publishing requires Premium. Your work is saved as a draft.";
  return `Your ${plan.name} plan allows ${plan.limits.maxPublishedCanvases} public pages – ${wanted} are marked visible. Hide a page or upgrade.`;
}

/** Första widgettypen i innehållet som planen inte innehåller, annars null. */
function firstBlockedWidget(content: CanvasContent, planId: PlanId): string | null {
  const types = goalNodes(content).flatMap((n) => n.data.widgets.map((w) => w.type));
  return types.find((type) => !planAllowsWidget(planId, type)) ?? null;
}


// ── Sidmenyn: synlighet, ny sida ─────────────────────────────────

/** Ögat i sidmenyn. Sparas direkt men syns för besökare först efter Publish. */
export async function setPageVisibility(canvasId: string, visible: boolean): Promise<ActionResult> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const supabase = await createClient();
  const { error } = await supabase.from("canvases").update({ visible }).eq("id", canvasId);
  return error ? { ok: false, error: "Could not change visibility." } : { ok: true };
}

/** Byt namn på en sida (rubriken under företagsnamnet och i sidmenyn). */
export async function renamePage(canvasId: string, rawTitle: string): Promise<ActionResult> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const title = rawTitle.trim();
  if (title.length < 1 || title.length > 80) return { ok: false, error: "The page name must be 1–80 characters." };

  const supabase = await createClient();
  const { error } = await supabase.from("canvases").update({ title }).eq("id", canvasId);
  if (error) return { ok: false, error: "Could not rename the page." };

  revalidatePath(`/c/${access.company.slug}`, "layout");
  return { ok: true };
}

/**
 * "+" i sidmenyn: en ny, tom sida (bara START) i samma företag.
 * Den är dold tills man slår på ögat och publicerar.
 */
export async function addPage(fromCanvasId: string): Promise<ActionResult<{ id: string }>> {
  const access = await getEditableCanvas(fromCanvasId);
  if (!access) return NOT_ALLOWED;

  const { company, plan } = access;
  const supabase = await createClient();

  const { data: existing } = await supabase.from("canvases").select("title").eq("company_id", company.id);
  const titles = (existing ?? []).map((row) => row.title);

  if (titles.length >= plan.limits.maxCanvases) {
    return {
      ok: false,
      code: "upgrade_required",
      error: `Your ${plan.name} plan allows ${plan.limits.maxCanvases} pages. Delete one or upgrade.`,
    };
  }

  const title = nextPageTitle(titles);
  const slug = await uniqueCanvasSlug(company.id, slugify(title));

  const { data: page, error } = await supabase
    .from("canvases")
    .insert({ company_id: company.id, title, slug, visible: false })
    .select("id")
    .single();

  if (error || !page) return { ok: false, error: "Could not add a page. Try again." };

  await supabase.from("canvas_drafts").insert({ canvas_id: page.id, content: blankCanvasContent() });
  return { ok: true, data: { id: page.id } };
}


// ── Versionshistorik ─────────────────────────────────────────────

export async function listVersions(canvasId: string): Promise<CanvasVersion[]> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("canvas_versions")
    .select("id, canvas_id, version_no, created_at")
    .eq("canvas_id", canvasId)
    .order("version_no", { ascending: false })
    .limit(50);

  return (data ?? []) as CanvasVersion[];
}

/** Lägg in en gammal version som nytt utkast. Historiken påverkas inte. */
export async function restoreVersion(canvasId: string, versionId: string): Promise<ActionResult<CanvasContent>> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const content = await getVersionContentForEditor(canvasId, versionId);
  if (!content) return { ok: false, error: "Version not found." };

  const saved = await saveDraft(canvasId, content);
  return saved.ok ? { ok: true, data: content } : saved;
}


// ── Ta bort ──────────────────────────────────────────────────────

/** Ta bort en sida permanent (ägare och redigerare). Frågan "Är du säker?" ställs i gränssnittet. */
export async function deleteCanvas(canvasId: string): Promise<ActionResult> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return NOT_ALLOWED;

  const supabase = await createClient();
  const { error } = await supabase.from("canvases").delete().eq("id", canvasId);
  if (error) return { ok: false, error: "Could not delete the canvas." };

  revalidatePath("/dashboard");
  revalidatePath(`/c/${access.company.slug}`, "layout");
  return { ok: true };
}
