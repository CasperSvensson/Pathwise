/**
 * ════════════════════════════════════════════════════════════════
 *  WIDGET-TYPER
 *
 *  Widgets finns i tre "sorter" (kind). Alla widgets av samma sort
 *  delar samma komponenter – bara konfigurationen skiljer:
 *
 *   choice  → man väljer ETT alternativ
 *             (omröstning, ja/nej, betyg 1–5, likert, reaktioner)
 *   text    → man skriver fritext (feedback)
 *   display → bara visning, ingen svarar (måluppföljning/progress)
 *
 *  Ny widget? Lägg till en rad i catalog.ts. Behövs en helt ny sort,
 *  lägg till en mapp + en rad i WidgetView/WidgetEditor/WidgetResults.
 * ════════════════════════════════════════════════════════════════
 */

export type WidgetType =
  | "poll"
  | "yes_no"
  | "rating"
  | "likert"
  | "reactions"
  | "priority"
  | "feedback"
  | "progress";

export type WidgetKind = "choice" | "text" | "display";

// ── Konfiguration per sort ─────────────────────────────────────

export type ChoiceOption = { id: string; label: string };

export type ChoiceConfig = {
  question: string;
  options: ChoiceOption[];
  /** Ska besökare se resultatet efter att de svarat? */
  showResults: boolean;
};

export type TextConfig = {
  question: string;
  placeholder: string;
};

export type ProgressConfig = {
  label: string;
  current: number;
  target: number;
  unit: string;
};

export type WidgetConfig = ChoiceConfig | TextConfig | ProgressConfig;

/** En widget som ligger i ett målkort (sparas i canvasens JSON). */
export type WidgetInstance = {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
};

// ── Svar och resultat ──────────────────────────────────────────

/** Det som sparas i widget_responses.value */
export type WidgetResponseValue = { choice: string } | { text: string };

/** Antal svar per alternativ, t.ex. { yes: 12, no: 3 } */
export type ChoiceCounts = Record<string, number>;

/** Alla siffror en sida behöver om sina widgets. Nyckel = widget-ID. */
export type CanvasWidgetState = {
  counts: Record<string, ChoiceCounts>;
  myResponses: Record<string, WidgetResponseValue>;
};
