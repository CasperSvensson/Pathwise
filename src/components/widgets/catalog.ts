/**
 * ════════════════════════════════════════════════════════════════
 *  WIDGETKATALOG – alla widgettyper som finns på plattformen.
 *
 *  Den här filen innehåller bara data (inga React-komponenter),
 *  så den kan användas både i webbläsaren och på servern.
 * ════════════════════════════════════════════════════════════════
 */

import type {
  ChoiceConfig,
  ProgressConfig,
  TextConfig,
  WidgetConfig,
  WidgetKind,
  WidgetType,
} from "@/components/widgets/types";

/** Hur ett choice-widget ritas: lista, rad med knappar eller emoji-chips. */
export type ChoiceLayout = "list" | "row" | "chips";

export type WidgetCatalogEntry = {
  type: WidgetType;
  kind: WidgetKind;
  label: string;
  description: string;
  /** Får ägaren ändra alternativen? (Nej för t.ex. ja/nej och betyg.) */
  editableOptions?: boolean;
  layout?: ChoiceLayout;
  defaultConfig: () => WidgetConfig;
};

// Hjälpare: bygg alternativlistor
const options = (...labels: string[]) => labels.map((label, i) => ({ id: `o${i + 1}`, label }));

export const WIDGET_CATALOG: Record<WidgetType, WidgetCatalogEntry> = {
  poll: {
    type: "poll",
    kind: "choice",
    label: "Poll",
    description: "Let the community vote between options.",
    editableOptions: true,
    layout: "list",
    defaultConfig: (): ChoiceConfig => ({
      question: "What should we do next?",
      options: options("Option 1", "Option 2"),
      showResults: true,
    }),
  },

  yes_no: {
    type: "yes_no",
    kind: "choice",
    label: "Yes / No",
    description: "A quick yes or no question.",
    layout: "row",
    defaultConfig: (): ChoiceConfig => ({
      question: "Should we do this?",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
      showResults: true,
    }),
  },

  rating: {
    type: "rating",
    kind: "choice",
    label: "Rating 1–5",
    description: "Rate an idea, product or initiative.",
    layout: "row",
    defaultConfig: (): ChoiceConfig => ({
      question: "How do you like this idea?",
      options: ["1", "2", "3", "4", "5"].map((n) => ({ id: n, label: n })),
      showResults: true,
    }),
  },

  likert: {
    type: "likert",
    kind: "choice",
    label: "Agree scale",
    description: "How much people agree with a statement.",
    layout: "list",
    defaultConfig: (): ChoiceConfig => ({
      question: "This is the right direction for us.",
      options: options("Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"),
      showResults: true,
    }),
  },

  priority: {
    type: "priority",
    kind: "choice",
    label: "Priority",
    description: "Which initiative matters most to you?",
    editableOptions: true,
    layout: "list",
    defaultConfig: (): ChoiceConfig => ({
      question: "What should we prioritise?",
      options: options("Initiative A", "Initiative B", "Initiative C"),
      showResults: true,
    }),
  },

  reactions: {
    type: "reactions",
    kind: "choice",
    label: "Reactions",
    description: "Show support with a reaction.",
    layout: "chips",
    defaultConfig: (): ChoiceConfig => ({
      question: "",
      options: [
        { id: "fire", label: "🔥" },
        { id: "heart", label: "❤️" },
        { id: "clap", label: "👏" },
        { id: "rocket", label: "🚀" },
      ],
      showResults: true,
    }),
  },

  feedback: {
    type: "feedback",
    kind: "text",
    label: "Feedback",
    description: "Collect comments, ideas and suggestions.",
    defaultConfig: (): TextConfig => ({
      question: "What do you think?",
      placeholder: "Share your idea…",
    }),
  },

  progress: {
    type: "progress",
    kind: "display",
    label: "Progress",
    description: "Show how close you are to the goal.",
    defaultConfig: (): ProgressConfig => ({
      label: "Progress",
      current: 0,
      target: 100,
      unit: "customers",
    }),
  },
};

export const WIDGET_TYPES = Object.keys(WIDGET_CATALOG) as WidgetType[];

export function widgetKind(type: WidgetType): WidgetKind {
  return WIDGET_CATALOG[type].kind;
}
