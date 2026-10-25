import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforcePlanLimits } from "@/lib/canvas/publishing";
import { ACTIVE_STATUSES, planFromStripePrice, type PlanId } from "@/lib/plans";

/**
 * ════════════════════════════════════════════════════════════════
 *  STRIPE ↔ DATABAS
 *  Hjälpfunktioner som används av checkout-, portal- och webhook-routes.
 * ════════════════════════════════════════════════════════════════
 */

/** Hämta användarens Stripe-kund, eller skapa en ny första gången. */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId }, // så webhooken vet vem kunden är
  });

  await admin
    .from("subscriptions")
    .upsert({ user_id: userId, stripe_customer_id: customer.id }, { onConflict: "user_id" });

  return customer.id;
}

/**
 * Spara en Stripe-prenumeration i vår databas.
 * Anropas av webhooken varje gång Stripe säger att något ändrats.
 */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const admin = createAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  // Vem är kunden? Vi sparade user_id när kunden skapades.
  const { data: row } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!row) {
    console.error(`[stripe] Unknown customer ${customerId}`);
    return;
  }

  const item = subscription.items.data[0];
  const isEnded = subscription.status === "canceled" || subscription.status === "incomplete_expired";
  const plan: PlanId = isEnded ? "free" : planFromStripePrice(item?.price.id);
  const periodEnd = item?.current_period_end;

  await admin
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      // En provperiod per konto: har man någon gång haft en är den förbrukad.
      ...(subscription.trial_start ? { trial_used: true } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", row.user_id);

  // Har planen blivit sämre? Avpublicera det som inte längre ryms (innehållet finns kvar).
  const effectivePlan: PlanId = ACTIVE_STATUSES.includes(subscription.status) ? plan : "free";
  await enforcePlanLimits(row.user_id, effectivePlan);
}
