"use client";

import { useState } from "react";
import { STATUS_LABELS, type GoalNodeData, type NodeStatus } from "@/lib/canvas/types";
import type { PlanId } from "@/lib/plans";
import { SidePanel, PanelTabs } from "@/components/canvas/SidePanel";
import { SectionLabel } from "@/components/ui/Panel";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { IllustrationPicker } from "@/components/editor/inspector/IllustrationPicker";
import { WidgetSection } from "@/components/editor/inspector/WidgetSection";
import { ResultsTab } from "@/components/editor/inspector/ResultsTab";

/**
 * Högerpanelen i editorn när en nod är vald (se designen "Admin – Editor").
 *
 *   → NODE                     🗑
 *   Edit | Results
 *   [ ] Completed        ┐
 *   [ ] In progress      ├ reglage – bara ett kan vara på åt gången
 *   [ ] Secret           ┘ (döljer innehållet bakom en "Top secret"-mapp)
 *   ILLUSTRATION   (3×3)
 *   CUSTOM IMAGE
 *   TITLE
 *   DESCRIPTION
 *   WIDGET  (rullgardin)
 */
type Props = {
  canvasId: string;
  companyId: string;
  planId: PlanId;
  nodeId: string;
  data: GoalNodeData;
  onChange: (patch: Partial<GoalNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
};

type Tab = "edit" | "results";

/** Reglagen överst i panelen. "planned" har inget eget – det är när alla är av. */
const STATUS_TOGGLES: { status: NodeStatus; label: string }[] = [
  { status: "done", label: STATUS_LABELS.done },
  { status: "in_progress", label: STATUS_LABELS.in_progress },
  { status: "secret", label: STATUS_LABELS.secret },
];

export function NodeInspector({ canvasId, companyId, planId, nodeId, data, onChange, onDelete, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("edit");

  return (
    <SidePanel
      label="Node"
      onClose={onClose}
      headerAction={
        <button onClick={onDelete} className="text-muted hover:text-danger" aria-label="Delete node">
          <Icon name="trash" size={18} />
        </button>
      }
    >
      <PanelTabs<Tab>
        tabs={[
          { id: "edit", label: "Edit" },
          { id: "results", label: "Results" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "results" ? (
        <ResultsTab canvasId={canvasId} nodeId={nodeId} widgets={data.widgets} />
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Ett mål har EN status: slår man på ett reglage slås de andra av. Alla av = planerad. */}
            {STATUS_TOGGLES.map(({ status, label }) => (
              <Toggle
                key={status}
                label={label}
                checked={data.status === status}
                onChange={(on) => onChange({ status: on ? status : "planned" })}
              />
            ))}
          </div>

          <section>
            <SectionLabel>Illustration</SectionLabel>
            <IllustrationPicker value={data.illustration} onChange={(illustration) => onChange({ illustration })} />
          </section>

          <section>
            <SectionLabel>Custom image</SectionLabel>
            <ImageUpload companyId={companyId} value={data.imageUrl} onChange={(imageUrl) => onChange({ imageUrl })} />
          </section>

          <TextInput
            label="Title"
            placeholder="Node title"
            value={data.title}
            maxLength={80}
            onChange={(e) => onChange({ title: e.target.value })}
          />

          <TextArea
            label="Description"
            placeholder="What is this goal about?"
            value={data.description}
            maxLength={600}
            onChange={(e) => onChange({ description: e.target.value })}
          />

          <section>
            <SectionLabel>Widget</SectionLabel>
            <WidgetSection widgets={data.widgets} planId={planId} onChange={(widgets) => onChange({ widgets })} />
          </section>
        </div>
      )}
    </SidePanel>
  );
}
