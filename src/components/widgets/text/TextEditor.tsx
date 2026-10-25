"use client";

import type { TextConfig } from "@/components/widgets/types";
import { TextInput } from "@/components/ui/Field";

export function TextEditor({ config, onChange }: { config: TextConfig; onChange: (config: TextConfig) => void }) {
  return (
    <div className="space-y-3">
      <TextInput
        placeholder="Question"
        value={config.question}
        onChange={(e) => onChange({ ...config, question: e.target.value })}
      />
      <TextInput
        placeholder="Placeholder text"
        value={config.placeholder}
        onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
      />
    </div>
  );
}
