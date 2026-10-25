import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/Panel";

/**
 * Formulärfält med samma utseende överallt.
 * <TextInput label="Title" name="title" />
 */

const BASE =
  "w-full rounded-lg border border-line-strong bg-raised px-3.5 py-2.5 text-[15px] text-fg " +
  "placeholder:text-faint outline-none transition focus:border-brand";

type WithLabel = { label?: string; hint?: string; error?: string };

function FieldWrapper({ label, hint, error, children }: WithLabel & { children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <SectionLabel>{label}</SectionLabel>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-danger" role="alert">{error}</span>}
    </label>
  );
}

export function TextInput({ label, hint, error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & WithLabel) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <input className={cn(BASE, className)} aria-invalid={!!error} {...rest} />
    </FieldWrapper>
  );
}

export function TextArea({ label, hint, error, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & WithLabel) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <textarea className={cn(BASE, "min-h-24 resize-y", className)} aria-invalid={!!error} {...rest} />
    </FieldWrapper>
  );
}

export function Select({ label, hint, error, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & WithLabel) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <span className="relative block">
        <select className={cn(BASE, "appearance-none pr-10", className)} {...rest}>
          {children}
        </select>
        {/* Pil som visar att det är en rullgardin */}
        <svg className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </FieldWrapper>
  );
}
