"use client";

import { useState } from "react";
import type { TextConfig } from "@/components/widgets/types";
import { WidgetBox } from "@/components/widgets/shared/WidgetBox";

/** Fritext-feedback för besökare. Man kan ändra sitt svar i efterhand. */
export function TextView({
  config,
  myText,
  pending,
  onSubmit,
}: {
  config: TextConfig;
  myText: string | null;
  pending: boolean;
  onSubmit?: (text: string) => void;
}) {
  const [draft, setDraft] = useState(myText ?? "");
  const [editing, setEditing] = useState(myText === null);

  // Redan svarat → visa svaret med möjlighet att ändra
  if (!editing && myText) {
    return (
      <WidgetBox title={config.question}>
        <p className="text-[13px] text-white/80">“{myText}”</p>
        <button type="button" onClick={() => setEditing(true)} className="mt-2 text-xs text-brand">
          Edit your answer
        </button>
      </WidgetBox>
    );
  }

  return (
    <WidgetBox title={config.question}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onSubmit?.(draft);
          setEditing(false);
        }}
        className="space-y-2"
      >
        <textarea
          disabled={!onSubmit}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={config.placeholder}
          maxLength={1000}
          rows={3}
          className="w-full resize-none rounded-lg bg-[#1c1c1c] p-2.5 text-[13px] text-white outline-none placeholder:text-faint focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={pending || !onSubmit || !draft.trim()}
          className="brand-gradient rounded-md px-3 py-1.5 font-mono text-xs text-white disabled:opacity-40"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </WidgetBox>
  );
}
