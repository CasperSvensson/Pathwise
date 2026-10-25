import { cn } from "@/lib/utils";

/**
 * Militär "Top secret"-mapp – visas i stället för innehållet i en hemlig nod.
 *
 *    ┌─────┐
 *    │     └──────────────────┐   ← flik + baksida (mörk)
 *    │  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │   ← papper som sticker upp
 *    ├────────────────────────┤
 *    │    ╔══════════════╗    │   ← framsida (ljus) med röd stämpel
 *    │    ║  TOP SECRET  ║    │
 *    │    ╚══════════════╝    │
 *    │ FILE NO. 4F2A          │
 *    └────────────────────────┘
 */

/** Färgerna på mappen (manilla-brun) och stämpeln (röd). */
const FOLDER_BACK = "bg-[#a9824a]";
const FOLDER_FRONT = "bg-[#d4b073]";
const PAPER = "bg-[#f3ecda]";
const STAMP = "border-[#c4231c] text-[#c4231c]";

export function SecretFolder({ fileNo, className }: { fileNo: string; className?: string }) {
  return (
    <div className={cn("relative h-[230px] w-full", className)} role="img" aria-label="Top secret">
      {/* Baksida med flik */}
      <div className={cn("absolute left-0 top-0 h-7 w-28 rounded-t-lg", FOLDER_BACK)} />
      <div className={cn("absolute inset-x-0 bottom-0 top-5 rounded-xl rounded-tl-none", FOLDER_BACK)} />

      {/* Papper som sticker upp */}
      <div className={cn("absolute inset-x-5 top-9 h-14 rounded-sm px-4 pt-3 shadow-sm", PAPER)}>
        <div className="h-1 w-3/4 rounded bg-black/15" />
        <div className="mt-2 h-1 w-1/2 rounded bg-black/15" />
      </div>

      {/* Framsida med stämpel */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 top-[4.5rem] flex items-center justify-center rounded-xl shadow-[0_-2px_6px_rgba(0,0,0,0.25)]",
          FOLDER_FRONT,
        )}
      >
        <span
          className={cn(
            "-rotate-[8deg] rounded-sm border-4 border-double px-4 py-1 text-[28px] font-black uppercase leading-none tracking-[0.12em] opacity-90",
            STAMP,
          )}
        >
          Top secret
        </span>
        <span className="absolute bottom-3 left-4 font-mono text-[11px] font-bold tracking-widest text-[#5e4520]">
          FILE NO. {fileNo}
        </span>
      </div>
    </div>
  );
}

/** Ett kort "aktnummer" av nodens id, t.ex. node_4f2a91c0 → 4F2A. */
export function fileNumber(nodeId: string): string {
  return nodeId.replace(/^node_/, "").slice(0, 4).toUpperCase();
}
