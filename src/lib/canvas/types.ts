/**
 * ════════════════════════════════════════════════════════════════
 *  CANVAS-DATAMODELL
 *
 *  En canvas sparas som ETT JSON-dokument (nodes + edges) i
 *  canvas_drafts.content (utkast) och canvas_versions.content
 *  (publicerade versioner). Då blir spara/återställa/versionera enkelt.
 * ════════════════════════════════════════════════════════════════
 */

import type { WidgetInstance } from "@/components/widgets/types";
import type { IllustrationKey } from "@/lib/canvas/illustrations";

/** Ett mål har exakt EN status. "secret" = innehållet döljs bakom en "Top secret"-mapp. */
export type NodeStatus = "planned" | "in_progress" | "done" | "secret";

/** Allt innehåll i ett målkort. */
export type GoalNodeData = {
  title: string;
  description: string;
  status: NodeStatus;
  illustration: IllustrationKey;
  /** Egen uppladdad bild – ersätter illustrationen om den finns. */
  imageUrl: string | null;
  widgets: WidgetInstance[];
};

export type StartNode = {
  id: string;
  type: "start";
  position: { x: number; y: number };
  data: { label: string };
};

export type GoalNode = {
  id: string;
  type: "goal";
  position: { x: number; y: number };
  data: GoalNodeData;
};

export type CanvasNode = StartNode | GoalNode;

/** Vilken sida av en nod en pil går ut från / in i. */
export type HandleSide = "top" | "right" | "bottom" | "left";

export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  /** Saknas i äldre canvas → höger ut, vänster in. */
  sourceHandle?: HandleSide;
  targetHandle?: HandleSide;
};

export type CanvasContent = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

export const STATUS_LABELS: Record<NodeStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Completed",
  secret: "Secret",
};
