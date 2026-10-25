/**
 * Kontrollerar att ett svar passar widgeten.
 * Körs på SERVERN innan något sparas – lita aldrig på webbläsaren.
 */

import { widgetKind } from "@/components/widgets/catalog";
import type { ChoiceConfig, WidgetInstance, WidgetResponseValue } from "@/components/widgets/types";

const MAX_TEXT_LENGTH = 1000;

/** Returnerar ett rensat svar, eller null om svaret är ogiltigt. */
export function validateResponse(widget: WidgetInstance, value: unknown): WidgetResponseValue | null {
  if (!value || typeof value !== "object") return null;

  switch (widgetKind(widget.type)) {
    case "choice": {
      const choice = (value as { choice?: unknown }).choice;
      const config = widget.config as ChoiceConfig;
      const exists = config.options.some((o) => o.id === choice);
      return exists ? { choice: choice as string } : null;
    }

    case "text": {
      const text = (value as { text?: unknown }).text;
      if (typeof text !== "string") return null;
      const trimmed = text.trim();
      if (trimmed.length === 0 || trimmed.length > MAX_TEXT_LENGTH) return null;
      return { text: trimmed };
    }

    case "display":
      return null; // Man kan inte svara på en progress-widget
  }
}
