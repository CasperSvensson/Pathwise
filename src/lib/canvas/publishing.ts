import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/plans";
import { redactSecretNodes } from "@/lib/canvas/content";
import type { CanvasContent } from "@/lib/canvas/types";

/**
 * ════════════════════════════════════════════════════════════════
 *  PUBLICERING – gör med admin-klienten EFTER behörighetskontroll.
 *  (Databasen tillåter inte vanliga användare att ändra
 *   published_version_id, se 0003_policies.sql.)
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Spara utkastet som en ny version och gör den publik.
 *   content          → det besökare får läsa (hemliga noder tömda)
 *   private_content  → hela utkastet, bara för redigerare (se 0006)
 */
export async function publishContent(params: {
  canvasId: string;
  userId: string;
  content: CanvasContent;
  searchText: string;
}): Promise<{ versionNo: number }> {
  const admin = createAdminClient();

  const { data: latest } = await admin
    .from("canvas_versions")
    .select("version_no")
    .eq("canvas_id", params.canvasId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNo = (latest?.version_no ?? 0) + 1;

  const { data: version, error } = await admin
    .from("canvas_versions")
    .insert({
      canvas_id: params.canvasId,
      version_no: versionNo,
      content: redactSecretNodes(params.content),
      private_content: params.content,
      created_by: params.userId,
    })
    .select("id")
    .single();

  if (error || !version) throw new Error("Could not save version");

  const { error: updateError } = await admin
    .from("canvases")
    .update({
      published_version_id: version.id,
      published_at: new Date().toISOString(),
      search_text: params.searchText,
    })
    .eq("id", params.canvasId);

  if (updateError) throw new Error("Could not publish");
  return { versionNo };
}

/** Gör en canvas privat igen. Innehållet och historiken finns kvar. */
export async function unpublishCanvasById(canvasId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("canvases").update({ published_version_id: null }).eq("id", canvasId);
}

/**
 * Körs när en användares plan ändras (Stripe-webhooken).
 * Har man fler publicerade canvas än planen tillåter avpubliceras de
 * äldsta. Inget innehåll raderas – det blir bara privat.
 */
export async function enforcePlanLimits(ownerId: string, planId: PlanId): Promise<void> {
  const admin = createAdminClient();
  const max = PLANS[planId].limits.maxPublishedCanvases;

  const { data: company } = await admin.from("companies").select("id").eq("owner_id", ownerId).maybeSingle();
  if (!company) return;

  const { data: published } = await admin
    .from("canvases")
    .select("id")
    .eq("company_id", company.id)
    .not("published_version_id", "is", null)
    .order("published_at", { ascending: false });

  const tooMany = (published ?? []).slice(max); // slice(Infinity) = inga
  for (const canvas of tooMany) {
    await unpublishCanvasById(canvas.id);
  }
}
