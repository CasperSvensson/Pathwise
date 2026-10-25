import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/utils";

/**
 * POST /api/stripe/portal
 * Skickar användaren till Stripes kundportal: byta kort, se kvitton,
 * byta plan eller säga upp. (Ställs in i Stripe Dashboard, se guiden.)
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(siteUrl("/login?next=/settings/subscription"), 303);

  const customerId = await getOrCreateStripeCustomer(user.id, user.email);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: siteUrl("/settings/subscription"),
  });

  return NextResponse.redirect(session.url, 303);
}
