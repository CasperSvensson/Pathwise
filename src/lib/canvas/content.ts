/**
 * Funktioner för att skapa, läsa och kontrollera canvas-innehåll.
 * Används av både editorn (webbläsaren) och server actions.
 */

import type { CanvasContent, GoalNode, GoalNodeData } from "@/lib/canvas/types";
import type { WidgetInstance } from "@/components/widgets/types";

/** Unikt ID för noder, kanter och widgets. */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Tomt innehåll för ett nytt målkort. */
export function emptyGoalData(): GoalNodeData {
  return {
    title: "New goal",
    description: "",
    status: "planned",
    illustration: "milestone",
    imageUrl: null,
    widgets: [],
  };
}

/** Skapa ett nytt målkort på en given position. */
export function createGoalNode(position: { x: number; y: number }): GoalNode {
  return { id: newId("node"), type: "goal", position, data: emptyGoalData() };
}

/** START-cirkeln som varje sida börjar med. */
const startNode = (): CanvasContent["nodes"][number] => ({
  id: "start",
  type: "start",
  position: { x: 0, y: 0 },
  data: { label: "START" },
});

/** En helt tom sida – bara START (används av "+" i sidmenyn). */
export function blankCanvasContent(): CanvasContent {
  return { nodes: [startNode()], edges: [] };
}

/** Startinnehåll för en ny canvas: START-cirkel → ett första mål. */
export function defaultCanvasContent(): CanvasContent {
  const firstGoal = createGoalNode({ x: 320, y: -180 });
  firstGoal.data.title = "Our first goal";
  firstGoal.data.description = "Describe what you want to achieve together with your community.";

  return {
    nodes: [
      startNode(),
      firstGoal,
    ],
    edges: [{ id: newId("edge"), source: "start", sourceHandle: "right", target: firstGoal.id, targetHandle: "left" }],
  };
}

/**
 * Läs in innehåll från databasen på ett säkert sätt.
 * Okänt/trasigt innehåll → tom canvas i stället för en krasch.
 */
export function parseCanvasContent(raw: unknown): CanvasContent {
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as CanvasContent).nodes) &&
    Array.isArray((raw as CanvasContent).edges)
  ) {
    return raw as CanvasContent;
  }
  return { nodes: [], edges: [] };
}

/** Är målet hemligt? Då ser besökare bara en "Top secret"-mapp. */
export function isSecret(data: GoalNodeData): boolean {
  return data.status === "secret";
}

/**
 * Tömmer hemliga noder på innehåll. Körs vid publicering, så att det
 * hemliga aldrig hamnar i det besökare kan läsa – inte ens via databas-API:t.
 * Noden behåller id, position och status, så mappen syns på rätt plats.
 */
export function redactSecretNodes(content: CanvasContent): CanvasContent {
  return {
    ...content,
    nodes: content.nodes.map((node) =>
      node.type === "goal" && isSecret(node.data)
        ? { ...node, data: { ...emptyGoalData(), title: "", status: "secret" } }
        : node,
    ),
  };
}

/** Alla målkort (utan START-noden). */
export function goalNodes(content: CanvasContent): GoalNode[] {
  return content.nodes.filter((n): n is GoalNode => n.type === "goal");
}

/** Hitta en widget i innehållet – används för att validera svar på servern. */
export function findWidget(
  content: CanvasContent,
  nodeId: string,
  widgetId: string,
): WidgetInstance | null {
  const node = goalNodes(content).find((n) => n.id === nodeId);
  return node?.data.widgets.find((w) => w.id === widgetId) ?? null;
}

/** All text i noderna – sparas vid publicering så Explore kan söka i den. Hemliga noder hoppas över. */
export function extractSearchText(content: CanvasContent): string {
  return goalNodes(content)
    .filter((n) => !isSecret(n.data))
    .map((n) => `${n.data.title} ${n.data.description}`)
    .join(" ")
    .slice(0, 5000);
}

/**
 * Ett jämförbart "fingeravtryck" av innehållet. Nycklarna sorteras, eftersom
 * databasen (jsonb) inte behåller ordningen. Används för att se om utkastet
 * skiljer sig från den publicerade versionen.
 */
export function canvasFingerprint(content: CanvasContent): string {
  const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value as object).sort().map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
      );
    }
    return value;
  };
  return JSON.stringify(sortKeys(content));
}

/** Hur många widgets ett målkort får ha. Höj för att tillåta fler. */
export const MAX_WIDGETS_PER_NODE = 1;

/** Ta bort widgets utöver gränsen (körs på servern innan utkastet sparas). */
export function limitWidgets(content: CanvasContent): CanvasContent {
  return {
    ...content,
    nodes: content.nodes.map((node) =>
      node.type === "goal"
        ? { ...node, data: { ...node.data, widgets: node.data.widgets.slice(0, MAX_WIDGETS_PER_NODE) } }
        : node,
    ),
  };
}

/** Enkel storlekskontroll så ingen kan spara gigantiska dokument. */
export const MAX_CONTENT_BYTES = 500_000;

export function isContentTooLarge(content: CanvasContent): boolean {
  return JSON.stringify(content).length > MAX_CONTENT_BYTES;
}
