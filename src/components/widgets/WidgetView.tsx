"use client";

import { useState, useTransition } from "react";
import { WIDGET_CATALOG } from "@/components/widgets/catalog";
import type {
  ChoiceConfig,
  ChoiceCounts,
  ProgressConfig,
  TextConfig,
  WidgetInstance,
  WidgetResponseValue,
} from "@/components/widgets/types";
import { ChoiceView } from "@/components/widgets/choice/ChoiceView";
import { TextView } from "@/components/widgets/text/TextView";
import { ProgressView } from "@/components/widgets/display/ProgressView";

/**
 * Ritar VILKEN widget som helst för en besökare.
 *
 * `onRespond` saknas → förhandsvisning (editorn), knapparna är inaktiva.
 * `closed`            → målet är klart: widgeten visas tonad och går inte att svara på.
 * `onRespond` returnerar ett felmeddelande eller null.
 */
export type RespondFn = (widget: WidgetInstance, value: WidgetResponseValue) => Promise<string | null>;

type Props = {
  widget: WidgetInstance;
  counts?: ChoiceCounts;
  myResponse?: WidgetResponseValue | null;
  onRespond?: RespondFn;
  closed?: boolean;
};

export function WidgetView({ widget, counts = {}, myResponse = null, onRespond, closed = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const entry = WIDGET_CATALOG[widget.type];

  // Gemensam svarslogik för alla widgetsorter
  const respond = onRespond && !closed
    ? (value: WidgetResponseValue) =>
        startTransition(async () => {
          setError(await onRespond(widget, value));
        })
    : undefined;

  const view = (() => {
    switch (entry.kind) {
      case "choice":
        return (
          <ChoiceView
            config={widget.config as ChoiceConfig}
            layout={entry.layout ?? "list"}
            counts={counts}
            myChoice={myResponse && "choice" in myResponse ? myResponse.choice : null}
            pending={pending}
            onChoose={respond && ((choice) => respond({ choice }))}
          />
        );
      case "text":
        return (
          <TextView
            config={widget.config as TextConfig}
            myText={myResponse && "text" in myResponse ? myResponse.text : null}
            pending={pending}
            onSubmit={respond && ((text) => respond({ text }))}
          />
        );
      case "display":
        return <ProgressView config={widget.config as ProgressConfig} />;
    }
  })();

  // Progress är bara visning och tonas inte ned
  const dimmed = closed && entry.kind !== "display";

  return (
    <div>
      <div className={dimmed ? "pointer-events-none opacity-45 grayscale" : undefined} aria-disabled={dimmed || undefined}>
        {view}
      </div>
      {dimmed && <p className="mt-1.5 text-xs font-semibold text-success">Goal reached · voting closed</p>}
      {error && <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
