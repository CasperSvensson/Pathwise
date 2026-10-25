/** Kategorier definieras av plattformen (inte av användarna). */
export const CATEGORIES = [
  "Fitness & Health",
  "Food & Drink",
  "Fashion",
  "Tech",
  "Gaming",
  "Music",
  "Education",
  "Creators",
  "Sustainability",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
