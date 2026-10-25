/**
 * ════════════════════════════════════════════════════════════════
 *  ABONNEMANG – all konfiguration på ETT ställe
 *
 *  Vill du ändra pris, gränser eller vad en plan får göra?
 *  Ändra här. Resten av koden läser bara härifrån.
 *
 *  Själva priset som dras från kortet styrs i Stripe (pris-ID i
 *  .env.local). "priceLabel" nedan är bara texten som visas.
 * ════════════════════════════════════════════════════════════════
 */

import type { WidgetType } from "@/components/widgets/types";

export type PlanId = "free" | "premium" | "enterprise";

/** Obegränsat antal – används i gränserna nedan. */
export const UNLIMITED = Number.POSITIVE_INFINITY;

export type PlanLimits = {
  /** Hur många canvas man får ha totalt (utkast + publicerade). */
  maxCanvases: number;
  /** Hur många canvas som får vara publicerade samtidigt. */
  maxPublishedCanvases: number;
  /** Hur många moderatorer/redigerare man kan bjuda in. */
  maxTeamMembers: number;
  /** Vilka widgets som finns i editorn. "all" = hela biblioteket. */
  widgets: "all" | WidgetType[];
  /** Får man se Results-fliken (statistik)? */
  analytics: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  description: string;
  /** Namnet på miljövariabeln som håller Stripe-pris-ID:t. */
  stripePriceEnv?: "STRIPE_PRICE_PREMIUM" | "STRIPE_PRICE_ENTERPRISE";
  features: string[];
  limits: PlanLimits;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "0 kr",
    description: "Follow companies and take part in their journey.",
    features: ["Follow companies", "Vote and give feedback", "1 private draft canvas"],
    limits: {
      maxCanvases: 1,
      maxPublishedCanvases: 0,
      maxTeamMembers: 0,
      widgets: "all",
      analytics: false,
    },
  },

  premium: {
    id: "premium",
    name: "Premium",
    priceLabel: "1 000 kr / month",
    description: "For smaller companies and creators building an active community.",
    stripePriceEnv: "STRIPE_PRICE_PREMIUM",
    features: [
      "Publish up to 5 canvas pages",
      "Widgets: polls, ratings, feedback and more",
      "Results and engagement statistics",
      "Public company page",
    ],
    limits: {
      maxCanvases: 10,
      maxPublishedCanvases: 5,
      maxTeamMembers: 0,
      widgets: ["poll", "yes_no", "rating", "feedback", "reactions", "progress"],
      analytics: true,
    },
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "5 000 kr / month",
    description: "For larger companies with bigger communities and teams.",
    stripePriceEnv: "STRIPE_PRICE_ENTERPRISE",
    features: [
      "Unlimited canvas pages",
      "Full widget library",
      "Advanced analytics",
      "Moderators and team permissions",
    ],
    limits: {
      maxCanvases: UNLIMITED,
      maxPublishedCanvases: UNLIMITED,
      maxTeamMembers: 25,
      widgets: "all",
      analytics: true,
    },
  },
};

/** Gratis provperiod för nya betalande kunder (en gång per konto). 0 = ingen. */
export const TRIAL_DAYS = 30;

/**
 * Stripe-statusar som räknas som "betald plan".
 * past_due = betalningen misslyckades men Stripe försöker igen
 * (respitperioden ställs in i Stripe, se docs/SETUP-STRIPE.md).
 */
export const ACTIVE_STATUSES = ["trialing", "active", "past_due"];

/** Plan-ID från Stripe-pris-ID (används av webhooken). */
export function planFromStripePrice(priceId: string | null | undefined): PlanId {
  if (!priceId) return "free";
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceEnv && process.env[plan.stripePriceEnv] === priceId) {
      return plan.id;
    }
  }
  return "free";
}

/** Får planen använda den här widgettypen? */
export function planAllowsWidget(planId: PlanId, type: WidgetType): boolean {
  const allowed = PLANS[planId].limits.widgets;
  return allowed === "all" || allowed.includes(type);
}

/** Text för gränser, t.ex. "3 / 5" eller "3 / ∞". */
export function formatLimit(used: number, max: number): string {
  return `${used} / ${max === UNLIMITED ? "∞" : max}`;
}

/**
 * Vart bakåtpilen på canvasen leder:
 * betalande användare → sin dashboard, alla andra (gratis/utloggade) → Explore.
 */
export function backHrefForPlan(planId: PlanId | null): string {
  return planId && planId !== "free" ? "/dashboard" : "/explore";
}
