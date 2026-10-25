import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_STATUSES, PLANS, type Plan, type PlanId } from "@/lib/plans";
import type { Canvas, Company, Profile, Subscription } from "@/lib/types";

/**
 * ════════════════════════════════════════════════════════════════
 *  AUTENTISERING & BEHÖRIGHET (serversidan)
 *
 *  Alla kontroller av "vem är inloggad", "vilken plan har hen" och
 *  "får hen redigera detta" ligger här, så att sidor och actions
 *  återanvänder samma logik.
 *
 *  cache() gör att samma anrop under EN request bara körs en gång,
 *  även om flera komponenter frågar.
 * ════════════════════════════════════════════════════════════════
 */


// ── Inloggad användare ───────────────────────────────────────────

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: profile ?? { id: user.id, display_name: null, avatar_url: null, locale: "en" },
  };
});

/** Som getCurrentUser, men skickar till /login om ingen är inloggad. */
export async function requireUser(nextPath = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}


// ── Plan / abonnemang ────────────────────────────────────────────

/**
 * Vilken plan har en användare JUST NU?
 * Läser från subscriptions-tabellen som bara Stripe-webhooken skriver till,
 * så användaren kan inte fuska sig till en högre plan.
 */
export const getPlanForUser = cache(
  async (userId: string): Promise<{ plan: Plan; subscription: Subscription | null }> => {
    // Admin-klient: vi behöver kunna läsa ÄGARENS plan även när en
    // moderator/redigerare är inloggad.
    const admin = createAdminClient();
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const subscription = data as Subscription | null;
    const isActive = subscription && ACTIVE_STATUSES.includes(subscription.status);
    const planId: PlanId = isActive ? subscription.plan : "free";

    return { plan: PLANS[planId], subscription };
  },
);


// ── Företag ──────────────────────────────────────────────────────

/** Företaget som den inloggade användaren äger (max ett per konto). */
export const getMyCompany = cache(async (): Promise<Company | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return data as Company | null;
});


// ── Canvas-behörighet ────────────────────────────────────────────

export type EditableCanvas = {
  user: CurrentUser;
  canvas: Canvas;
  company: Company;
  /** Företagsägarens plan – den styr gränserna, även för moderatorer. */
  plan: Plan;
  isOwner: boolean;
};

/**
 * Hämtar en canvas OM inloggad användare får redigera den, annars null.
 * Används av editor-sidan och av alla canvas-actions.
 */
export async function getEditableCanvas(canvasId: string): Promise<EditableCanvas | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data: canvas } = await supabase
    .from("canvases")
    .select("*, company:companies(*)")
    .eq("id", canvasId)
    .maybeSingle();

  if (!canvas) return null;

  // Databasfunktionen avgör: ägare eller redigerare?
  const { data: canEdit } = await supabase.rpc("is_company_editor", {
    target_company: canvas.company_id,
  });
  if (!canEdit) return null;

  const company = canvas.company as Company;
  const { plan } = await getPlanForUser(company.owner_id);

  return {
    user,
    canvas: canvas as Canvas,
    company,
    plan,
    isOwner: company.owner_id === user.id,
  };
}
