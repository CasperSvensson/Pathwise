"use client";

import { WIDGET_CATALOG, WIDGET_TYPES } from "@/components/widgets/catalog";
import { WidgetEditor } from "@/components/widgets/WidgetEditor";
import type { WidgetConfig, WidgetInstance, WidgetType } from "@/components/widgets/types";
import { newId } from "@/lib/canvas/content";
import { planAllowsWidget, type PlanId } from "@/lib/plans";
import { Select } from "@/components/ui/Field";

/**
 * Nodens widget: EN rullgardin för att välja typ, och under den widgetens inställningar.
 *
 * En nod har max en widget (se MAX_WIDGETS_PER_NODE i lib/canvas/content.ts).
 * Datan sparas fortfarande som en lista, så att flera widgets kan tillåtas
 * senare utan att ändra databasen.
 */
export function WidgetSection({
  widgets,
  planId,
  onChange,
}: {
  widgets: WidgetInstance[];
  planId: PlanId;
  onChange: (widgets: WidgetInstance[]) => void;
}) {
  const current = widgets[0] ?? null;

  // Byt typ → ny widget med standardinställningar (eller ingen alls)
  const chooseType = (type: WidgetType | "") =>
    onChange(type ? [{ id: newId("w"), type, config: WIDGET_CATALOG[type].defaultConfig() }] : []);

  const updateConfig = (config: WidgetConfig) => current && onChange([{ ...current, config }]);

  return (
    <div className="space-y-3">
      <Select
        id="node-widget-type"
        value={current?.type ?? ""}
        onChange={(e) => chooseType(e.target.value as WidgetType | "")}
        hint={current ? WIDGET_CATALOG[current.type].description : "Let visitors vote, rate or give feedback on this goal."}
      >
        <option value="">No widget</option>
        {WIDGET_TYPES.map((type) => (
          <option key={type} value={type} disabled={!planAllowsWidget(planId, type)}>
            {WIDGET_CATALOG[type].label}
            {!planAllowsWidget(planId, type) ? " (Enterprise)" : ""}
          </option>
        ))}
      </Select>

      {current && (
        <div className="rounded-xl border border-line-strong bg-raised/60 p-3">
          <WidgetEditor key={current.id} widget={current} onChange={updateConfig} />
        </div>
      )}
    </div>
  );
}
