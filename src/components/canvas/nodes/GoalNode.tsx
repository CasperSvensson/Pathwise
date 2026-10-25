"use client";

import type { NodeProps } from "@xyflow/react";
import { NodeHandles } from "@/components/canvas/nodes/NodeHandles";
import type { GoalNodeData } from "@/lib/canvas/types";
import { STATUS_LABELS } from "@/lib/canvas/types";
import { IllustrationIcon } from "@/lib/canvas/illustrations";
import { WidgetView, type RespondFn } from "@/components/widgets/WidgetView";
import { useCanvasRuntime } from "@/components/canvas/CanvasRuntime";
import { Icon } from "@/components/ui/Icon";
import { SecretFolder, fileNumber } from "@/components/canvas/nodes/SecretFolder";
import { cn } from "@/lib/utils";

/**
 * Målkortet på canvasen (se designen):
 *
 *   ┌───────────────────────┐
 *   │        [bild]       ☆ │  ← stjärnan fylls i när målet är klart
 *   │ Titel                 │
 *   │ Beskrivning           │
 *   │ ┌───────────────────┐ │
 *   │ │ widget            │ │  ← nodens widget (max en)
 *   │ └───────────────────┘ │
 *   └───────────────────────┘
 *
 * Hemligt mål → bara en "Top secret"-mapp (se SecretFolder).
 */
export function GoalNode({ id, data }: NodeProps) {
  const node = data as GoalNodeData;
  const { widgetState, onRespond } = useCanvasRuntime();

  const widget = node.widgets[0];

  // Widgeten vet inte vilken nod den ligger i – vi lägger till nod-ID:t här.
  const respond: RespondFn | undefined = onRespond && ((widget, value) => onRespond(id, widget, value));

  return (
    // select-none: dra i kortet flyttar noden i stället för att markera text
    <div
      className={cn(
        "goal-card relative w-[310px] select-none rounded-2xl border-[1.5px] text-left transition-colors",
        CARD_COLORS[node.status],
        // Pågående mål = mjukt pulserande ljusblått sken (globals.css)
        node.status === "in_progress" && "goal-card--active",
      )}
    >
      {node.status === "secret" ? (
        <SecretCard nodeId={id} title={node.title} />
      ) : (
      <div className="px-6 pt-6 pb-5">
        {/* Bild eller illustration */}
        <div className="relative mb-4 flex h-[170px] items-center justify-center">
          {node.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            // draggable={false} + pointer-events-none: bilden går inte att dra ut,
            // så ett drag på bilden flyttar noden
            <img
              src={node.imageUrl}
              alt=""
              draggable={false}
              className="pointer-events-none max-h-full max-w-[85%] object-contain"
            />
          ) : (
            <span className="text-brand">
              <IllustrationIcon name={node.illustration} size={96} />
            </span>
          )}
          <span
            className={cn("absolute -right-1 -top-1", node.status === "done" ? "text-highlight" : "text-white/80")}
            title={STATUS_LABELS[node.status]}
          >
            <Icon name="star" size={28} strokeWidth={1.4} className={node.status === "done" ? "fill-current" : ""} />
          </span>
        </div>

        <StatusLabel status={node.status} />
        <h3 className="mt-1 text-[26px] font-bold leading-tight text-white">{node.title || "Untitled"}</h3>
        {node.description && (
          <p className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-white">{node.description}</p>
        )}

        {widget && (
          <div className="mt-4">
            <WidgetView
              widget={widget}
              counts={widgetState.counts[widget.id]}
              myResponse={widgetState.myResponses[widget.id]}
              onRespond={respond}
              closed={node.status === "done"}
            />
          </div>
        )}
      </div>
      )}

      <NodeHandles nodeId={id} />
    </div>
  );
}

/** Kantfärg och bakgrund per status. Klart mål = grön ton. */
const CARD_COLORS: Record<GoalNodeData["status"], string> = {
  planned: "border-brand bg-card",
  in_progress: "border-brand bg-card",
  done: "goal-card--done border-success bg-[#223129]",
  secret: "border-line-strong bg-card",
};

/**
 * Hemligt mål. Besökare får aldrig titeln (servern tömmer den vid
 * publicering), så raden under mappen syns bara för redigerare.
 */
function SecretCard({ nodeId, title }: { nodeId: string; title: string }) {
  return (
    <div className="px-6 pt-6 pb-5">
      <SecretFolder fileNo={fileNumber(nodeId)} />
      {title && (
        <p className="mt-3 flex items-center gap-1.5 truncate text-xs font-semibold text-muted" title="Only editors can see this">
          <Icon name="lock" size={12} /> {title}
        </p>
      )}
    </div>
  );
}

/** Status som färgad text ovanför titeln (ingen ruta runt). */
function StatusLabel({ status }: { status: GoalNodeData["status"] }) {
  if (status === "planned") return null;
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold",
        status === "done" ? "text-success" : "text-brand",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
