import type { ReactNode } from "react";

/**
 * Den ljusare rutan inuti målkortet där widgeten ritas (som "Poll" och
 * "Progress" i designen).
 *
 * "nodrag nowheel" säger till canvas-biblioteket att klick och scroll här
 * inne ska gå till widgeten – inte flytta eller zooma canvasen.
 */
export function WidgetBox({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="nodrag nowheel cursor-default rounded-xl bg-card-inner/70 p-3.5">
      {title && <p className="mb-2.5 text-[13px] font-semibold text-white">{title}</p>}
      {children}
    </div>
  );
}
