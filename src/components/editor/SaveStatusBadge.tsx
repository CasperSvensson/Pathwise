import type { SaveStatus } from "@/components/editor/useAutosave";
import { cn } from "@/lib/utils";

const LABELS: Record<SaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Not saved – check your connection",
};

/** Liten text som visar om utkastet är sparat. */
export function SaveStatusBadge({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  return (
    <span className={cn("hidden items-center gap-2 font-mono text-xs lg:flex", status === "error" ? "text-danger" : "text-muted")}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "saved" && "bg-success",
          status === "saving" && "animate-pulse bg-warning",
          status === "unsaved" && "bg-faint",
          status === "error" && "bg-danger",
        )}
      />
      {LABELS[status]}
      {status === "error" && (
        <button onClick={onRetry} className="underline">
          Retry
        </button>
      )}
    </span>
  );
}
