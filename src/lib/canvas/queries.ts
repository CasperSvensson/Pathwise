import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCanvasContent } from "@/lib/canvas/content";
import type { CanvasContent } from "@/lib/canvas/types";
import type { CanvasWidgetState, WidgetResponseValue } from "@/components/widgets/types";
import type { Canvas, Company, PageItem } from "@/lib/types";

/**
 * ════════════════════════════════════════════════════════════════
 *  LÄSFRÅGOR FÖR CANVAS – återanvänds av sidor och actions.
 * ════════════════════════════════════════════════════════════════
 */


// ── Företag via slug (med stöd för gamla slugs) ──────────────────

export type CompanyLookup =
  | { status: "found"; company: Company }
  | { status: "redirect"; newSlug: string }
  | { status: "blocked" }
  | { status: "missing" };

export async function findCompanyBySlug(slug: string): Promise<CompanyLookup> {
  const supabase = await createClient();

  const { data: company } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (company) return { status: "found", company: company as Company };

  // Dolt av säkerhetsreglerna? Då kan användaren vara blockerad.
  if (await isBlockedFromCompanySlug(slug)) return { status: "blocked" };

  // Kanske en gammal slug? Då skickar vi vidare till den nya adressen.
  const { data: redirect } = await supabase
    .from("company_slug_redirects")
    .select("company:companies(slug)")
    .eq("old_slug", slug)
    .maybeSingle();

  const newSlug = (redirect?.company as { slug?: string } | null)?.slug;
  return newSlug ? { status: "redirect", newSlug } : { status: "missing" };
}

/**
 * Används av sidorna under /c/[company]: returnerar företaget, eller
 * skickar vidare (gammal slug), till Access denied (blockerad) eller 404.
 */
export async function requireCompanyBySlug(slug: string, pathSuffix = ""): Promise<Company> {
  const lookup = await findCompanyBySlug(slug);

  switch (lookup.status) {
    case "found":
      return lookup.company;
    case "redirect":
      redirect(`/c/${lookup.newSlug}${pathSuffix}`);
    case "blocked":
      redirect("/access-denied");
    case "missing":
      notFound();
  }
}

async function isBlockedFromCompanySlug(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("blocked_users")
    .select("user_id, company:companies!inner(slug)")
    .eq("user_id", user.id)
    .eq("company.slug", slug)
    .maybeSingle();

  return !!data;
}


// ── Publicerade canvas ───────────────────────────────────────────

/** Alla publicerade canvas för ett företag (till profilsidan). */
export async function listPublishedCanvases(companyId: string): Promise<Canvas[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("canvases")
    .select("*")
    .eq("company_id", companyId)
    .not("published_version_id", "is", null)
    .order("created_at", { ascending: true });

  return (data ?? []) as Canvas[];
}

/** Canvas → rad i sidmenyn. */
export function toPageItem(canvas: Canvas): PageItem {
  return {
    id: canvas.id,
    title: canvas.title,
    slug: canvas.slug,
    visible: canvas.visible,
    isPublic: !!canvas.published_version_id,
  };
}

/** Alla sidor (även dolda) – för editorns sidmeny. RLS visar bara utkast för personal. */
export async function listCompanyPages(companyId: string): Promise<PageItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("canvases")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as Canvas[]).map(toPageItem);
}

/** En publicerad canvas + dess innehåll. null = finns inte / inte publicerad. */
export async function getPublishedCanvas(
  companyId: string,
  canvasSlug: string,
): Promise<{ canvas: Canvas; content: CanvasContent } | null> {
  const supabase = await createClient();

  const { data: canvas } = await supabase
    .from("canvases")
    .select("*, version:canvas_versions!canvases_published_version_fk(content)")
    .eq("company_id", companyId)
    .eq("slug", canvasSlug)
    .maybeSingle();

  if (!canvas?.published_version_id || !canvas.version) return null;

  return {
    canvas: canvas as Canvas,
    content: parseCanvasContent((canvas.version as { content: unknown }).content),
  };
}


// ── Widget-siffror och egna svar ─────────────────────────────────

/**
 * Hämtar aggregerade siffror (alla widgets på canvasen) och – om någon
 * är inloggad – vad hen själv har svarat.
 */
export async function getCanvasWidgetState(canvasId: string, userId: string | null): Promise<CanvasWidgetState> {
  const supabase = await createClient();
  const state: CanvasWidgetState = { counts: {}, myResponses: {} };

  const { data: rows } = await supabase.rpc("get_widget_counts", { target_canvas: canvasId });
  for (const row of (rows ?? []) as { widget_id: string; choice: string; total: number }[]) {
    state.counts[row.widget_id] ??= {};
    state.counts[row.widget_id][row.choice] = Number(row.total);
  }

  if (userId) {
    const { data: mine } = await supabase
      .from("widget_responses")
      .select("widget_id, value")
      .eq("canvas_id", canvasId)
      .eq("user_id", userId);

    for (const row of mine ?? []) {
      state.myResponses[row.widget_id] = row.value as WidgetResponseValue;
    }
  }

  return state;
}


// ── Hela innehållet i en version (bara för redigerare) ───────────

/**
 * Hela innehållet i en version – även hemliga noder. BARA för redigerare:
 * anropa efter getEditableCanvas(). Läser med admin-klienten eftersom
 * kolumnen private_content är stängd för vanliga användare (0006).
 * Används för att jämföra utkastet mot det publicerade och för "återställ".
 */
export async function getVersionContentForEditor(
  canvasId: string,
  versionId: string | null,
): Promise<CanvasContent | null> {
  if (!versionId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("canvas_versions")
    .select("content, private_content")
    .eq("id", versionId)
    .eq("canvas_id", canvasId)
    .maybeSingle();
  // Äldre versioner (före 0006) saknar private_content
  return data ? parseCanvasContent(data.private_content ?? data.content) : null;
}


// ── Utkast (bara för redigerare) ─────────────────────────────────

export async function getDraftContent(canvasId: string): Promise<CanvasContent> {
  const supabase = await createClient();
  const { data } = await supabase.from("canvas_drafts").select("content").eq("canvas_id", canvasId).maybeSingle();
  return parseCanvasContent(data?.content);
}
