/**
 * Illustrationerna man kan välja för ett målkort (se "ILLUSTRATION" i
 * editorns högerpanel). Lägg till en ny genom att lägga till en rad här.
 */

import type { ReactNode } from "react";

export type IllustrationKey =
  | "launch"
  | "milestone"
  | "idea"
  | "achievement"
  | "technical"
  | "analytics"
  | "team"
  | "feature"
  | "system";

type Illustration = { label: string; paths: ReactNode };

/** SVG-innehåll (24×24, linjer). Färgen kommer från CSS "currentColor". */
export const ILLUSTRATIONS: Record<IllustrationKey, Illustration> = {
  launch: {
    label: "Launch",
    paths: (
      <>
        <path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z" />
        <circle cx="12" cy="10" r="2" />
        <path d="M9 16l-3 3m9-3l3 3M12 18v4" />
      </>
    ),
  },
  milestone: {
    label: "Milestone",
    paths: (
      <>
        <path d="M5 21V3" />
        <path d="M5 4h13l-3 4 3 4H5" />
      </>
    ),
  },
  idea: {
    label: "Idea",
    paths: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
      </>
    ),
  },
  achievement: {
    label: "Achievement",
    paths: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />,
  },
  technical: {
    label: "Technical",
    paths: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M9 10l-2 2 2 2M15 10l2 2-2 2M13 9l-2 6" />
      </>
    ),
  },
  analytics: {
    label: "Analytics",
    paths: <path d="M4 20h16M6 20v-5M10 20v-8M14 20v-11M18 20V5" />,
  },
  team: {
    label: "Team",
    paths: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8 0 6 1.5 6 5" />
      </>
    ),
  },
  feature: {
    label: "Feature",
    paths: <path d="M12 3l9 9-9 9-9-9z" />,
  },
  system: {
    label: "System",
    paths: (
      <>
        <path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" />
        <path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z" />
      </>
    ),
  },
};

export const ILLUSTRATION_KEYS = Object.keys(ILLUSTRATIONS) as IllustrationKey[];

/** Rita en illustration i valfri storlek. */
export function IllustrationIcon({ name, size = 24 }: { name: IllustrationKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ILLUSTRATIONS[name]?.paths ?? ILLUSTRATIONS.milestone.paths}
    </svg>
  );
}
