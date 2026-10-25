"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNodeResults, type WidgetResultData } from "@/actions/results";
import { WIDGET_CATALOG } from "@/components/widgets/catalog";
import { WidgetResults } from "@/components/widgets/WidgetResults";
import type { WidgetInstance } from "@/components/widgets/types";

/** "Results"-fliken: statistik för nodens widgets. Hämtas när fliken öppnas. */
export function ResultsTab({ canvasId, nodeId, widgets }: { canvasId: string; nodeId: string; widgets: WidgetInstance[] }) {
  const [results, setResults] = useState<Record<string, WidgetResultData> | null>(null);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResults(null);
    setError(null);

    getNodeResults(canvasId, nodeId).then((result) => {
      if (cancelled) return;
      if (result.ok) setResults(result.data ?? {});
      else setError({ message: result.error, upgrade: result.code === "upgrade_required" });
    });

    return () => {
      cancelled = true;
    };
  }, [canvasId, nodeId]);

  if (widgets.length === 0) {
    return <p className="text-sm text-muted">Add a widget in the Edit tab to start collecting answers.</p>;
  }

  if (error) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted">{error.message}</p>
        {error.upgrade && <Link href="/settings/subscription" className="text-brand">See plans →</Link>}
      </div>
    );
  }

  if (!results) return <p className="text-sm text-muted">Loading results…</p>;

  return (
    <div className="space-y-6">
      {widgets.map((widget) => (
        <section key={widget.id}>
          <h4 className="mb-3 text-sm font-semibold">
            {WIDGET_CATALOG[widget.type].label}
            {"question" in widget.config && widget.config.question ? ` – ${widget.config.question}` : ""}
          </h4>
          <WidgetResults widget={widget} data={results[widget.id] ?? { counts: {}, texts: [] }} />
        </section>
      ))}
    </div>
  );
}
