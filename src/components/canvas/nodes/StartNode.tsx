"use client";

import type { NodeProps } from "@xyflow/react";
import { NodeHandles } from "@/components/canvas/nodes/NodeHandles";

/** Den blå START-cirkeln. Varje canvas börjar här. */
export function StartNode({ id, data }: NodeProps) {
  return (
    <div className="brand-gradient relative flex h-[150px] w-[150px] items-center justify-center rounded-full shadow-[0_0_40px_rgba(79,124,255,0.55)]">
      <span className="text-xl font-bold text-white">{(data as { label?: string }).label ?? "START"}</span>
      <NodeHandles nodeId={id} />
    </div>
  );
}
