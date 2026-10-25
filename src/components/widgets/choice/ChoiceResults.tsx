import type { ChoiceConfig, ChoiceCounts } from "@/components/widgets/types";
import { ProgressBar } from "@/components/widgets/shared/ProgressBar";
import { Stat } from "@/components/widgets/shared/Stat";
import { percent } from "@/lib/utils";

/** Resultat för ägaren: antal och andel per alternativ (+ snitt för betyg). */
export function ChoiceResults({ config, counts, isNumeric }: { config: ChoiceConfig; counts: ChoiceCounts; isNumeric: boolean }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const average = isNumeric && total
    ? config.options.reduce((sum, o) => sum + Number(o.id) * (counts[o.id] ?? 0), 0) / total
    : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-sm">
        <Stat label="Responses" value={total} />
        {average !== null && <Stat label="Average" value={average.toFixed(1)} />}
      </div>

      {config.options.map((option) => {
        const count = counts[option.id] ?? 0;
        return (
          <div key={option.id}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{option.label}</span>
              <span className="text-muted">{count} · {percent(count, total)}%</span>
            </div>
            <ProgressBar value={percent(count, total)} />
          </div>
        );
      })}
    </div>
  );
}
