"use client";

import type { ChoiceConfig } from "@/components/widgets/types";
import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@/components/ui/Field";
import { newId } from "@/lib/canvas/content";

/** Inställningar för choice-widgets i editorns högerpanel. */
export function ChoiceEditor({
  config,
  editableOptions,
  onChange,
}: {
  config: ChoiceConfig;
  editableOptions: boolean;
  onChange: (config: ChoiceConfig) => void;
}) {
  const update = (patch: Partial<ChoiceConfig>) => onChange({ ...config, ...patch });

  const renameOption = (id: string, label: string) =>
    update({ options: config.options.map((o) => (o.id === id ? { ...o, label } : o)) });

  const removeOption = (id: string) =>
    update({ options: config.options.filter((o) => o.id !== id) });

  const addOption = () =>
    update({ options: [...config.options, { id: newId("o"), label: `Option ${config.options.length + 1}` }] });

  return (
    <div className="space-y-3">
      <TextInput
        placeholder="Question"
        value={config.question}
        onChange={(e) => update({ question: e.target.value })}
      />

      {editableOptions && (
        <div className="space-y-2">
          {config.options.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <TextInput value={option.label} onChange={(e) => renameOption(option.id, e.target.value)} />
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={config.options.length <= 2}
                className="text-muted hover:text-danger disabled:opacity-30"
                aria-label="Remove option"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-sm text-brand">
            <Icon name="plus" size={14} /> Add option
          </button>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={config.showResults}
          onChange={(e) => update({ showResults: e.target.checked })}
        />
        Show results to visitors after they answer
      </label>
    </div>
  );
}
