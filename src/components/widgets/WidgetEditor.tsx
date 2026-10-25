"use client";

import { WIDGET_CATALOG } from "@/components/widgets/catalog";
import type { ChoiceConfig, ProgressConfig, TextConfig, WidgetConfig, WidgetInstance } from "@/components/widgets/types";
import { ChoiceEditor } from "@/components/widgets/choice/ChoiceEditor";
import { TextEditor } from "@/components/widgets/text/TextEditor";
import { ProgressEditor } from "@/components/widgets/display/ProgressEditor";

/** Ritar inställningarna för VILKEN widget som helst (i editorns högerpanel). */
export function WidgetEditor({
  widget,
  onChange,
}: {
  widget: WidgetInstance;
  onChange: (config: WidgetConfig) => void;
}) {
  const entry = WIDGET_CATALOG[widget.type];

  switch (entry.kind) {
    case "choice":
      return (
        <ChoiceEditor
          config={widget.config as ChoiceConfig}
          editableOptions={!!entry.editableOptions}
          onChange={onChange}
        />
      );
    case "text":
      return <TextEditor config={widget.config as TextConfig} onChange={onChange} />;
    case "display":
      return <ProgressEditor config={widget.config as ProgressConfig} onChange={onChange} />;
  }
}
