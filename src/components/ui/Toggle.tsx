"use client";

import { cn } from "@/lib/utils";

/** Av/på-reglage – som "Completed" i nodpanelen. */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Visas vid hover när reglaget är avstängt – förklarar varför. */
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={disabled ? hint : undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border border-line-strong bg-raised px-4 py-3 text-left transition",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition",
          checked ? "bg-success" : "bg-[#2e2e2e]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
            checked ? "left-5" : "left-1",
          )}
        />
      </span>
      <span className={cn("text-[15px]", checked ? "text-fg" : "text-muted")}>{label}</span>
    </button>
  );
}
