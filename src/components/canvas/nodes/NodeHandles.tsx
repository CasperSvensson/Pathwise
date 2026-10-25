"use client";

import { useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { useCanvasRuntime } from "@/components/canvas/CanvasRuntime";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { SIDES } from "@/lib/canvas/layout";
import type { HandleSide } from "@/lib/canvas/types";

const POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

/** Rörelse (px) som räknas som "dra" i stället för "klicka". */
const CLICK_TOLERANCE = 6;

/**
 * Fyra handtag, ett på varje sida av noden (syns när noden är vald i editorn).
 *
 *   ○            klicka  → ny nod åt det hållet, kopplad med en pil
 * ○ [nod] ○      dra     → dra en pil till en befintlig nod
 *   ○
 *
 * När man drar en pil nära en annan nod visas den nodens handtag, och det
 * närmaste lyser upp – där fäster pilen när man släpper.
 *
 * Själva handtaget (React Flow) sitter mitt på kanten så att pilarna möter
 * kortet. Den synliga pricken ligger en bit utanför (se globals.css).
 * Handtagen finns även för besökare – utan dem vet pilarna inte var de ska fästa.
 */
export function NodeHandles({ nodeId }: { nodeId: string }) {
  const { editable, onAddBeside, dropTarget } = useCanvasRuntime();
  const isDropTarget = dropTarget?.nodeId === nodeId;

  return (
    <>
      {SIDES.map((side) => (
        <Handle
          key={side}
          id={side}
          type="source"
          position={POSITION[side]}
          isConnectable={editable}
          className={cn(
            `node-handle node-handle--${side}`,
            // En pil dras mot den här noden: visa alla handtag, lys upp det den fäster vid
            isDropTarget && "node-handle--show",
            isDropTarget && dropTarget?.side === side && "node-handle--active",
          )}
        >
          {editable && onAddBeside && <HandleDot side={side} onClick={() => onAddBeside(nodeId, side)} />}
        </Handle>
      ))}
    </>
  );
}

/** Den synliga pricken. Visar ett plus vid hover. */
function HandleDot({ side, onClick }: { side: HandleSide; onClick: () => void }) {
  const pressedAt = useRef<{ x: number; y: number } | null>(null);

  return (
    <span
      className="node-handle__dot"
      role="button"
      aria-label={`Add a node to the ${side}`}
      title="Click to add a node · drag to connect"
      // Klick avgörs vid pointerup (fungerar även med touch, där React Flow
      // kan stoppa det vanliga click-eventet). Rörde man sig var det ett drag.
      onPointerDown={(e) => (pressedAt.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const start = pressedAt.current;
        pressedAt.current = null;
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < CLICK_TOLERANCE) onClick();
      }}
      // Låt inte klicket bubbla till noden (då skulle den gamla noden väljas igen)
      onClick={(e) => e.stopPropagation()}
    >
      <Icon name="plus" size={16} strokeWidth={2.4} />
    </span>
  );
}
