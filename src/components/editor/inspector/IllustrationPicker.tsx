"use client";

import { ILLUSTRATION_KEYS, ILLUSTRATIONS, IllustrationIcon, type IllustrationKey } from "@/lib/canvas/illustrations";
import { cn } from "@/lib/utils";

/** 3×3-rutnätet med illustrationer (Launch, Milestone, Idea …). */
export function IllustrationPicker({ value, onChange }: { value: IllustrationKey; onChange: (key: IllustrationKey) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ILLUSTRATION_KEYS.map((key) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={selected}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border py-3.5 text-[13px] transition",
              selected
                ? "border-brand bg-brand/15 font-semibold text-brand"
                : "border-line-strong bg-raised text-muted hover:text-fg",
            )}
          >
            <span className="text-brand">
              <IllustrationIcon name={key} size={26} />
            </span>
            {ILLUSTRATIONS[key].label}
          </button>
        );
      })}
    </div>
  );
}
