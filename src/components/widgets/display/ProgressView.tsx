import type { ProgressConfig } from "@/components/widgets/types";
import { ProgressBar } from "@/components/widgets/shared/ProgressBar";
import { WidgetBox } from "@/components/widgets/shared/WidgetBox";
import { percent } from "@/lib/utils";

/** Måluppföljning: "16 of 1000 pizzas ······ 2%" (som i designen). */
export function ProgressView({ config }: { config: ProgressConfig }) {
  const value = percent(config.current, config.target);

  return (
    <WidgetBox title={config.label}>
      <ProgressBar value={value} />
      <div className="mt-1.5 flex justify-between text-[10px] text-white/80">
        <span>
          {config.current.toLocaleString()} of {config.target.toLocaleString()} {config.unit}
        </span>
        <span>{value}%</span>
      </div>
    </WidgetBox>
  );
}
