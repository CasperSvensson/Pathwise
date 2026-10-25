"use client";

import type { ChoiceLayout } from "@/components/widgets/catalog";
import type { ChoiceConfig, ChoiceCounts } from "@/components/widgets/types";
import { WidgetBox } from "@/components/widgets/shared/WidgetBox";
import { cn, percent } from "@/lib/utils";

/**
 * Visar ett "välj ett alternativ"-widget för besökare.
 * Samma komponent används för omröstning, ja/nej, betyg, likert och reaktioner –
 * bara `layout` skiljer.
 */

type Props = {
  config: ChoiceConfig;
  layout: ChoiceLayout;
  counts: ChoiceCounts;
  myChoice: string | null;
  pending: boolean;
  onChoose?: (optionId: string) => void; // saknas = förhandsvisning
};

export function ChoiceView({ config, layout, counts, myChoice, pending, onChoose }: Props) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const showResults = config.showResults && myChoice !== null;

  if (layout === "chips") {
    return <ReactionChips config={config} counts={counts} myChoice={myChoice} pending={pending} onChoose={onChoose} />;
  }

  return (
    <WidgetBox title={config.question || undefined}>
      <div className={cn(layout === "row" ? "flex gap-2" : "space-y-2")}>
        {config.options.map((option) => {
          const isMine = myChoice === option.id;
          const share = percent(counts[option.id] ?? 0, total);

          return (
            <button
              key={option.id}
              type="button"
              disabled={pending || !onChoose}
              onClick={() => onChoose?.(option.id)}
              aria-pressed={isMine}
              className={cn(
                "relative flex w-full items-center justify-between overflow-hidden rounded-lg bg-[#1c1c1c] px-3.5 py-2.5 text-left text-[13px] text-white transition",
                "hover:bg-[#242424] disabled:cursor-default",
                isMine && "ring-1 ring-brand",
                layout === "row" && "justify-center",
              )}
            >
              {/* Resultatstapel bakom texten (bara i listor – knapprader visar procent i texten) */}
              {showResults && layout === "list" && (
                <span className="absolute inset-y-0 left-0 bg-brand/25" style={{ width: `${share}%` }} />
              )}

              <span className="relative">
                {option.label}
                {showResults && layout === "row" && <span className="ml-1.5 text-xs text-muted">{share}%</span>}
              </span>

              {layout === "list" &&
                (showResults ? (
                  <span className="relative text-xs text-muted">{share}%</span>
                ) : (
                  <RadioCircle checked={isMine} />
                ))}
            </button>
          );
        })}
      </div>
    </WidgetBox>
  );
}

function RadioCircle({ checked }: { checked: boolean }) {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center rounded-full border border-white/80">
      {checked && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  );
}

/** Emoji-reaktioner: alltid synliga antal, klick igen = byt reaktion. */
function ReactionChips({ config, counts, myChoice, pending, onChoose }: Omit<Props, "layout">) {
  return (
    <div className="nodrag flex flex-wrap gap-2">
      {config.options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={pending || !onChoose}
          onClick={() => onChoose?.(option.id)}
          aria-pressed={myChoice === option.id}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-line-strong bg-[#1c1c1c] px-3 py-1 text-sm transition hover:border-brand",
            myChoice === option.id && "border-brand bg-brand/15",
          )}
        >
          <span>{option.label}</span>
          <span className="text-xs text-muted">{counts[option.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
