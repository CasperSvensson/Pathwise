/**
 * Kopplingen mellan vår datamodell (CanvasContent) och canvas-biblioteket
 * React Flow. Allt som är React Flow-specifikt samlas här.
 */

import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { GoalNode } from "@/components/canvas/nodes/GoalNode";
import { StartNode } from "@/components/canvas/nodes/StartNode";
import type { CanvasContent, CanvasEdge, CanvasNode, HandleSide } from "@/lib/canvas/types";

/** Vilken komponent som ritar vilken nodtyp. Måste ligga utanför komponenter. */
export const NODE_TYPES = { start: StartNode, goal: GoalNode };

/**
 * Pilarnas utseende: blå kurva med en öppen, rundad pilspets (">").
 * width/height räknas i linjens tjocklek – 20 ger en spets på ca 25 px.
 */
export const DEFAULT_EDGE_OPTIONS = {
  type: "default",
  markerEnd: { type: MarkerType.Arrow, color: "#4f7cff", width: 20, height: 20, strokeWidth: 1 },
};

/** Vår data → React Flow-noder och -kanter. */
export function toFlow(content: CanvasContent): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: content.nodes.map((node) => ({
      ...node,
      deletable: node.type !== "start", // START går inte att ta bort
    })),
    edges: content.edges.map((edge) => ({
      ...edge,
      // Äldre canvas saknar sidor: då går pilen från höger till vänster
      sourceHandle: edge.sourceHandle ?? "right",
      targetHandle: edge.targetHandle ?? "left",
    })),
  };
}

/**
 * React Flow-noder → vår data.
 * React Flow lägger till egna fält (selected, measured …) som vi inte vill spara.
 */
export function fromFlow(nodes: Node[], edges: Edge[]): CanvasContent {
  return {
    nodes: nodes.map(
      (n) =>
        ({
          id: n.id,
          type: n.type,
          position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
          data: n.data,
        }) as CanvasNode,
    ),
    edges: edges.map(
      (e): CanvasEdge => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: (e.sourceHandle ?? "right") as HandleSide,
        targetHandle: (e.targetHandle ?? "left") as HandleSide,
      }),
    ),
  };
}

/** Läs in och skriv ut igen – ger samma form som editorn sparar (för jämförelser). */
export function normalizeContent(content: CanvasContent): CanvasContent {
  const { nodes, edges } = toFlow(content);
  return fromFlow(nodes, edges);
}
