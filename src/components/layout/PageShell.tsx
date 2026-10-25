import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { cn } from "@/lib/utils";

/** Ramen runt vanliga sidor: prickbakgrund, meny, innehåll, sidfot. */
export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="dot-grid min-h-dvh">
      <SiteHeader />
      <main className={cn("mx-auto px-4 pt-12 md:px-12", narrow ? "max-w-2xl" : "max-w-6xl")}>{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Sidrubrik med valfri text under. */
export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-mono text-3xl tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
