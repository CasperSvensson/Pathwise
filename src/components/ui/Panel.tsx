import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Den mörka rundade rutan som används för toppbarer, inspector och kort. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-line bg-surface shadow-[0_10px_40px_rgba(0,0,0,0.45)]",
        className,
      )}
      {...rest}
    />
  );
}

/** Liten rubrik i versaler – som "ILLUSTRATION", "TITLE" i designen. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </p>
  );
}
