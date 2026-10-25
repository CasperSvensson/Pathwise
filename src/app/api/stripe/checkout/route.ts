import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, getPlanForUser } from "@/lib/auth";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { PLANS, TRIAL_DAYS, type PlanId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/utils";

/**
 * POST /api/stripe/checkout   (formulärfält: plan=premium|enterprise)
 *
 * Skapar en Stripe Checkout-session och skickar användaren dit.
 * Vi tar ALDRIG emot kortuppgifter själva – det sköter Stripe.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(siteUrl("/login?next=/settings/subscription"), 303);

  const form = await request.formData();
  const plan = PLANS[form.get("plan") as PlanId];
  const priceId = plan?.stripePriceEnv ? process.env[plan.stripePriceEnv] : undefined;

  if (!plan || !priceId) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email);
  const { subscription } = await getPlanForUser(user.id);
  const giveTrial = TRIAL_DAYS > 0 && !subscription?.trial_used;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: siteUrl("/settings/subscription?status=success"),
    cancel_url: siteUrl("/settings/subscription?status=canceled"),
    client_reference_id: user.id,

    ...(giveTrial && {
      // Provperiod UTAN kort: kortet efterfrågas först när perioden tar slut.
      payment_method_collection: "if_required",
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
    }),
  });

  return NextResponse.redirect(session.url!, 303);
}
