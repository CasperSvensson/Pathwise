import { WIDGET_CATALOG } from "@/components/widgets/catalog";
import type { ChoiceConfig, WidgetInstance } from "@/components/widgets/types";
import type { WidgetResultData } from "@/actions/results";
import { ChoiceResults } from "@/components/widgets/choice/ChoiceResults";
import { TextResults } from "@/components/widgets/text/TextResults";

/** Ritar resultatet för VILKEN widget som helst (editorns Results-flik). */
export function WidgetResults({ widget, data }: { widget: WidgetInstance; data: WidgetResultData }) {
  const entry = WIDGET_CATALOG[widget.type];

  switch (entry.kind) {
    case "choice":
      return (
        <ChoiceResults
          config={widget.config as ChoiceConfig}
          counts={data.counts}
          isNumeric={widget.type === "rating"}
        />
      );
    case "text":
      return <TextResults texts={data.texts} />;
    case "display":
      return <p className="text-sm text-muted">This widget shows progress and collects no answers.</p>;
  }
}
