import type { ReactNode } from "react";
import { BrandBadge } from "@/components/ui/BrandBadge";
import { SITE } from "@/lib/site";

/** Gemensam ram för login, registrering och lösenordssidor. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="dot-grid flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-panel)] border border-line bg-surface p-8 shadow-2xl">
        <div className="mb-8">
          <BrandBadge title={SITE.name} />
        </div>
        <h1 className="font-mono text-2xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
