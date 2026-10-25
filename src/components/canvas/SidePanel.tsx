"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Panelen till höger (dator) / längst ner (mobil).
 * Används av editorns inspector OCH besökarens nodvy.
 */
export function SidePanel({
  label,
  onClose,
  headerAction,
  children,
}: {
  label: string;
  onClose: () => void;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside
      className={
        "animate-slide-in fixed inset-x-0 bottom-0 z-20 flex max-h-[75dvh] flex-col rounded-t-[var(--radius-panel)] " +
        "border border-line bg-surface shadow-2xl " +
        "md:inset-x-auto md:right-6 md:top-[120px] md:bottom-24 md:max-h-none md:w-[400px] md:rounded-[var(--radius-panel)]"
      }
    >
      <header className="mx-4 flex items-center justify-between border-b border-line px-2 pt-5 pb-4">
        <button onClick={onClose} className="flex items-center gap-3 text-muted hover:text-fg" aria-label="Close panel">
          <Icon name="arrowRight" size={26} strokeWidth={1.5} />
          <span className="text-sm font-semibold uppercase tracking-[0.14em]">{label}</span>
        </button>
        {headerAction}
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8">{children}</div>
    </aside>
  );
}

/** Flikar, som "Edit | Results" i designen. */
export function PanelTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="-mx-6 mb-5 flex border-b border-line" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={
            "flex-1 border-b-2 pb-3 text-[15px] transition " +
            (active === tab.id ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg")
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
