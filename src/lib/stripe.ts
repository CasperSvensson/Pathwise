import "server-only";
import Stripe from "stripe";

/**
 * Stripe-klienten. Den hemliga nyckeln finns bara på servern.
 * Vi anger ingen apiVersion → SDK:ns inbyggda version används,
 * vilket alltid matchar typerna i paketet.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  appInfo: { name: "Pathwise" },
});
