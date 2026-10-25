"use client";

import { SidePanel } from "@/components/canvas/SidePanel";
import type { CanvasRespondFn } from "@/components/canvas/CanvasRuntime";
import { WidgetView } from "@/components/widgets/WidgetView";
import type { CanvasWidgetState } from "@/components/widgets/types";
import { IllustrationIcon } from "@/lib/canvas/illustrations";
import { STATUS_LABELS, type GoalNode } from "@/lib/canvas/types";
import { SecretFolder, fileNumber } from "@/components/canvas/nodes/SecretFolder";

/** När en besökare klickar på ett mål: hela beskrivningen och alla widgets. */
export function NodeDetailPanel({
  node,
  widgetState,
  onRespond,
  onClose,
}: {
  node: GoalNode;
  widgetState: CanvasWidgetState;
  onRespond: CanvasRespondFn;
  onClose: () => void;
}) {
  const { data } = node;

  // Hemligt mål: bara mappen (servern har redan tömt innehållet)
  if (data.status === "secret") {
    return (
      <SidePanel label={STATUS_LABELS.secret} onClose={onClose}>
        <SecretFolder fileNo={fileNumber(node.id)} />
        <p className="mt-5 text-muted">This goal is classified for now. Follow along to find out when it&apos;s revealed.</p>
      </SidePanel>
    );
  }

  return (
    <SidePanel label={STATUS_LABELS[data.status]} onClose={onClose}>
      <div className="mb-5 flex h-40 items-center justify-center rounded-xl bg-card">
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt="" className="max-h-full object-contain" />
        ) : (
          <span className="text-brand">
            <IllustrationIcon name={data.illustration} size={72} />
          </span>
        )}
      </div>

      <h2 className="text-2xl font-bold">{data.title}</h2>
      {data.description && <p className="mt-2 whitespace-pre-line text-muted">{data.description}</p>}

      <div className="mt-6 space-y-4">
        {data.widgets.map((widget) => (
          <WidgetView
            key={widget.id}
            widget={widget}
            counts={widgetState.counts[widget.id]}
            myResponse={widgetState.myResponses[widget.id]}
            onRespond={(w, value) => onRespond(node.id, w, value)}
            closed={data.status === "done"}
          />
        ))}
      </div>
    </SidePanel>
  );
}
