"use client";

import type { ProgressConfig } from "@/components/widgets/types";
import { TextInput } from "@/components/ui/Field";

export function ProgressEditor({ config, onChange }: { config: ProgressConfig; onChange: (config: ProgressConfig) => void }) {
  const update = (patch: Partial<ProgressConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="space-y-3">
      <TextInput placeholder="Label" value={config.label} onChange={(e) => update({ label: e.target.value })} />
      <div className="grid grid-cols-3 gap-2">
        <TextInput
          type="number"
          min={0}
          placeholder="Now"
          value={config.current}
          onChange={(e) => update({ current: Number(e.target.value) })}
        />
        <TextInput
          type="number"
          min={1}
          placeholder="Goal"
          value={config.target}
          onChange={(e) => update({ target: Math.max(1, Number(e.target.value)) })}
        />
        <TextInput placeholder="Unit" value={config.unit} onChange={(e) => update({ unit: e.target.value })} />
      </div>
    </div>
  );
}
