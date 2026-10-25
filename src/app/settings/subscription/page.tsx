import { getPlanForUser, requireUser } from "@/lib/auth";
import { PLANS, TRIAL_DAYS, type Plan } from "@/lib/plans";
import { PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export const metadata = { title: "Subscription" };

const MESSAGES: Record<string, string> = {
  success: "Thanks! Your plan is being activated – it can take a few seconds.",
  canceled: "Checkout was cancelled. Nothing was charged.",
};

/**
 * Abonnemangssidan.
 *  - Uppgradera  → POST /api/stripe/checkout  → Stripes betalsida
 *  - Hantera     → POST /api/stripe/portal    → Stripes kundportal
 *                  (byta kort, kvitton, säga upp)
 */
export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const user = await requireUser("/settings/subscription");
  const { plan: currentPlan, subscription } = await getPlanForUser(user.id);

  const hasStripeCustomer = !!subscription?.stripe_customer_id;
  const canTrial = TRIAL_DAYS > 0 && !subscription?.trial_used;

  return (
    <>
      <PageTitle title="Subscription" subtitle={`You're on ${currentPlan.name}.`} />

      {status && MESSAGES[status] && (
        <p className="mb-6 rounded-lg border border-line-strong bg-raised p-4 text-sm">{MESSAGES[status]}</p>
      )}

      <SubscriptionStatus subscription={subscription} />

      <div className="grid gap-6 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === currentPlan.id} canTrial={canTrial} hasPaidPlan={currentPlan.id !== "free"} />
        ))}
      </div>

      {hasStripeCustomer && (
        <form action="/api/stripe/portal" method="POST" className="mt-10">
          <Button type="submit" variant="subtle">Manage billing, receipts and cancellation</Button>
        </form>
      )}
    </>
  );
}

function SubscriptionStatus({ subscription }: { subscription: Awaited<ReturnType<typeof getPlanForUser>>["subscription"] }) {
  if (!subscription || subscription.plan === "free") return null;

  const end = subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : null;

  const text =
    subscription.status === "trialing" ? `Free trial – ends ${end}.`
    : subscription.status === "past_due" ? "Your last payment failed. Update your card to keep publishing."
    : subscription.cancel_at_period_end ? `Cancelled – your plan stays active until ${end}.`
    : end ? `Renews ${end}.`
    : null;

  if (!text) return null;

  return (
    <p className={cn("mb-8 text-sm", subscription.status === "past_due" ? "text-danger" : "text-muted")}>{text}</p>
  );
}

function PlanCard({ plan, isCurrent, canTrial, hasPaidPlan }: { plan: Plan; isCurrent: boolean; canTrial: boolean; hasPaidPlan: boolean }) {
  const isPaid = !!plan.stripePriceEnv;

  return (
    <div className={cn("flex flex-col rounded-[22px] border bg-surface p-6", isCurrent ? "border-brand" : "border-line")}>
      <h2 className="text-xl font-semibold">{plan.name}</h2>
      <p className="mt-1 font-mono text-2xl">{plan.priceLabel}</p>
      <p className="mt-3 text-sm text-muted">{plan.description}</p>

      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {isCurrent ? (
          <p className="font-mono text-sm text-brand">Current plan</p>
        ) : isPaid && !hasPaidPlan ? (
          // Ny betalande kund → Checkout
          <form action="/api/stripe/checkout" method="POST">
            <input type="hidden" name="plan" value={plan.id} />
            <Button type="submit" className="w-full">
              {canTrial ? `Start ${TRIAL_DAYS}-day free trial` : `Choose ${plan.name}`}
            </Button>
          </form>
        ) : isPaid ? (
          // Har redan en betald plan → byt i kundportalen
          <form action="/api/stripe/portal" method="POST">
            <Button type="submit" variant="subtle" className="w-full">Switch plan</Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
