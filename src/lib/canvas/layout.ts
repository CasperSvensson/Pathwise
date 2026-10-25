/**
 * ════════════════════════════════════════════════════════════════
 *  GEOMETRI PÅ CANVASEN
 *  Rena beräkningar utan React – var nya noder hamnar och vilken
 *  sida av en nod en pil ska fästa i.
 * ════════════════════════════════════════════════════════════════
 */

import type { HandleSide } from "@/lib/canvas/types";

export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };

export const SIDES: HandleSide[] = ["top", "right", "bottom", "left"];

export const OPPOSITE_SIDE: Record<HandleSide, HandleSide> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

/** Storlek på ett nytt, tomt målkort (används innan det hunnit mätas). */
export const NEW_GOAL_SIZE = { width: 310, height: 330 };

/** Avstånd mellan en nod och en ny nod som skapas bredvid. */
const GAP = { horizontal: 140, vertical: 110 };

/** Övre vänstra hörnet för en ny nod som läggs på `side` om `from`. */
export function placeBeside(from: Rect, side: HandleSide, size = NEW_GOAL_SIZE): Point {
  const centerX = from.x + from.width / 2 - size.width / 2;
  const centerY = from.y + from.height / 2 - size.height / 2;

  switch (side) {
    case "right":
      return { x: from.x + from.width + GAP.horizontal, y: centerY };
    case "left":
      return { x: from.x - size.width - GAP.horizontal, y: centerY };
    case "top":
      return { x: centerX, y: from.y - size.height - GAP.vertical };
    case "bottom":
      return { x: centerX, y: from.y + from.height + GAP.vertical };
  }
}

/** Mittpunkten på en sida av en nod (där handtaget sitter). */
export function sidePoint(rect: Rect, side: HandleSide): Point {
  switch (side) {
    case "top":
      return { x: rect.x + rect.width / 2, y: rect.y };
    case "bottom":
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case "left":
      return { x: rect.x, y: rect.y + rect.height / 2 };
    case "right":
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
  }
}

/** Hur nära (i canvas-pixlar) en dragen pil måste vara en nod för att visa dess handtag. */
export const DROP_PROXIMITY = 70;

/** Avstånd från en punkt till en rektangel (0 om punkten är inuti). */
function distanceToRect(point: Point, rect: Rect): number {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

export type DropTarget = { nodeId: string; side: HandleSide };

/**
 * Medan man drar en pil: vilken nod är närmast pekaren, och vilket av dess
 * fyra handtag är närmast? Noden man drar från räknas inte.
 * null = ingen nod tillräckligt nära.
 */
export function nearestDropTarget(
  nodes: { id: string; rect: Rect }[],
  pointer: Point,
  excludeId: string,
): DropTarget | null {
  let best: { id: string; rect: Rect; distance: number } | null = null;

  for (const node of nodes) {
    if (node.id === excludeId) continue;
    const distance = distanceToRect(pointer, node.rect);
    if (distance <= DROP_PROXIMITY && (!best || distance < best.distance)) best = { ...node, distance };
  }
  if (!best) return null;

  const rect = best.rect;
  const side = SIDES.reduce((closest, candidate) => {
    const a = sidePoint(rect, candidate);
    const b = sidePoint(rect, closest);
    return Math.hypot(a.x - pointer.x, a.y - pointer.y) < Math.hypot(b.x - pointer.x, b.y - pointer.y) ? candidate : closest;
  });

  return { nodeId: best.id, side };
}
