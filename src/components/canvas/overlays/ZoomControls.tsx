"use client";

import { Panel, useReactFlow, useViewport } from "@xyflow/react";
import { Icon } from "@/components/ui/Icon";

/** "43 %  [+] [−] [Reset]" nere till höger. */
export function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const buttonClass =
    "flex h-11 min-w-11 items-center justify-center rounded-lg border border-success/25 bg-success/5 px-3 font-mono text-fg/80 transition hover:bg-success/15";

  return (
    <Panel position="bottom-right" className="!m-6 flex items-center gap-2">
      <span className="mr-3 hidden font-mono text-xl text-faint sm:inline">{Math.round(zoom * 100)}%</span>
      <button className={buttonClass} onClick={() => zoomIn({ duration: 200 })} aria-label="Zoom in">
        <Icon name="plus" />
      </button>
      <button className={buttonClass} onClick={() => zoomOut({ duration: 200 })} aria-label="Zoom out">
        <Icon name="minus" />
      </button>
      <button className={buttonClass} onClick={() => fitView({ duration: 300, padding: 0.35, maxZoom: 1 })}>
        Reset
      </button>
    </Panel>
  );
}
