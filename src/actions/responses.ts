"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { findWidget, goalNodes, parseCanvasContent } from "@/lib/canvas/content";
import { validateResponse } from "@/components/widgets/validation";
import type { ActionResult } from "@/lib/types";

/**
 * En besökare svarar på en widget (röstar, betygsätter, skriver feedback …).
 *
 * Kontroller, i ordning:
 *  1. Inloggad?                         → annars "login_required"
 *  2. Canvasen publicerad & synlig?     → RLS returnerar inget om man är blockerad
 *  3. Finns widgeten i PUBLICERADE versionen, och är målet inte klart?
 *  4. Är svaret giltigt för widgeten?
 *  5. Spara – en rad per användare och widget (nytt svar ersätter gammalt)
 */
export async function submitResponse(input: {
  canvasId: string;
  nodeId: string;
  widgetId: string;
  value: unknown;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "login_required", error: "Log in to take part." };

  const supabase = await createClient();

  const { data: canvas } = await supabase
    .from("canvases")
    .select("id, version:canvas_versions!canvases_published_version_fk(content)")
    .eq("id", input.canvasId)
    .not("published_version_id", "is", null)
    .maybeSingle();

  if (!canvas?.version) return { ok: false, error: "This canvas is not available." };

  const content = parseCanvasContent((canvas.version as { content: unknown }).content);

  const node = goalNodes(content).find((n) => n.id === input.nodeId);
  if (node?.data.status === "secret") return { ok: false, error: "This goal is secret." };
  if (node?.data.status === "done") return { ok: false, error: "This goal is reached – voting is closed." };

  const widget = findWidget(content, input.nodeId, input.widgetId);
  if (!widget) return { ok: false, error: "This question no longer exists." };

  const value = validateResponse(widget, input.value);
  if (!value) return { ok: false, error: "That answer isn't valid." };

  const { error } = await supabase.from("widget_responses").upsert(
    {
      canvas_id: input.canvasId,
      node_id: input.nodeId,
      widget_id: input.widgetId,
      user_id: user.id,
      value,
    },
    { onConflict: "canvas_id,widget_id,user_id" },
  );

  return error ? { ok: false, error: "Could not save your answer. Try again." } : { ok: true };
}
