import { cn } from "@/lib/utils";

/** Vit stapel på mörk bakgrund – används av progress-widgeten och resultaten. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[#4a4a4a]", className)}>
      <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${clamped}%` }} />
    </div>
  );
}
