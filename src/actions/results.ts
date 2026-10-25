"use server";

import { createClient } from "@/lib/supabase/server";
import { getEditableCanvas } from "@/lib/auth";
import type { ChoiceCounts } from "@/components/widgets/types";
import type { ActionResult } from "@/lib/types";

/** Allt Results-fliken behöver för EN widget. */
export type WidgetResultData = {
  counts: ChoiceCounts;
  texts: { text: string; createdAt: string }[];
};

/**
 * Resultat för alla widgets i en nod (editorns Results-flik).
 * Bara redigerare, och bara om planen innehåller statistik.
 */
export async function getNodeResults(
  canvasId: string,
  nodeId: string,
): Promise<ActionResult<Record<string, WidgetResultData>>> {
  const access = await getEditableCanvas(canvasId);
  if (!access) return { ok: false, error: "Not allowed.", code: "forbidden" };

  if (!access.plan.limits.analytics) {
    return { ok: false, code: "upgrade_required", error: "Results are included in Premium." };
  }

  const supabase = await createClient();
  const results: Record<string, WidgetResultData> = {};
  const entry = (widgetId: string) => (results[widgetId] ??= { counts: {}, texts: [] });

  // Röster/val – aggregerat i databasen
  const { data: counts } = await supabase.rpc("get_widget_counts", { target_canvas: canvasId });
  for (const row of (counts ?? []) as { widget_id: string; choice: string; total: number }[]) {
    entry(row.widget_id).counts[row.choice] = Number(row.total);
  }

  // Fritext – läses direkt (RLS tillåter personal att se svaren)
  const { data: texts } = await supabase
    .from("widget_responses")
    .select("widget_id, value, created_at")
    .eq("canvas_id", canvasId)
    .eq("node_id", nodeId)
    .not("value->text", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  for (const row of texts ?? []) {
    entry(row.widget_id).texts.push({ text: (row.value as { text: string }).text, createdAt: row.created_at });
  }

  return { ok: true, data: results };
}
