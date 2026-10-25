import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyCompany, getPlanForUser, requireUser } from "@/lib/auth";
import { formatLimit } from "@/lib/plans";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { CompanyCard } from "@/components/company/CompanyCard";
import { CanvasRow } from "@/app/dashboard/CanvasRow";
import { Button } from "@/components/ui/Button";
import { Stat } from "@/components/widgets/shared/Stat";
import type { Canvas, Company } from "@/lib/types";

export const metadata = { title: "Dashboard" };

/** Översikt efter inloggning: eget företag, canvas, plan och följda företag. */
export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const company = await getMyCompany();
  const { plan } = await getPlanForUser(user.id);
  const supabase = await createClient();

  const [{ data: canvasRows }, { data: followRows }] = await Promise.all([
    company
      ? supabase.from("canvases").select("*").eq("company_id", company.id).order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("follows").select("company:companies(*)").eq("user_id", user.id),
  ]);

  const canvases = (canvasRows ?? []) as Canvas[];
  const followed = (followRows ?? []).map((row) => row.company as unknown as Company).filter(Boolean);
  const publishedCount = canvases.filter((c) => c.published_version_id).length;

  return (
    <PageShell>
      <PageTitle
        title={`Hi ${user.profile.display_name ?? "there"}`}
        subtitle="Here's what's happening with your journeys."
        action={company && <Button href="/create">Create new</Button>}
      />

      {/* ── Mitt företag ───────────────────────────────────────── */}
      {!company ? (
        <section className="rounded-[22px] border border-dashed border-line-strong p-10 text-center">
          <h2 className="text-xl font-semibold">Share your own journey</h2>
          <p className="mt-2 text-muted">Create a company or creator profile to start building canvases.</p>
          <Button href="/settings/company?welcome=1" className="mt-6">Create profile</Button>
        </section>
      ) : (
        <section className="rounded-[22px] border border-line bg-surface p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Link href={`/c/${company.slug}`} className="text-xl font-semibold hover:text-brand">{company.name} →</Link>
            <div className="flex gap-8">
              <Stat label="Plan" value={plan.name} />
              <Stat label="Published" value={formatLimit(publishedCount, plan.limits.maxPublishedCanvases)} />
              <Stat label="Canvases" value={formatLimit(canvases.length, plan.limits.maxCanvases)} />
            </div>
          </div>

          {canvases.length === 0 ? (
            <p className="text-muted">No canvases yet. <Link href="/create" className="text-brand">Create your first →</Link></p>
          ) : (
            <ul className="divide-y divide-line">
              {canvases.map((canvas) => (
                <CanvasRow key={canvas.id} canvas={canvas} companySlug={company.slug} />
              ))}
            </ul>
          )}

          {plan.id === "free" && (
            <p className="mt-6 text-sm text-muted">
              Publishing is part of Premium. <Link href="/settings/subscription" className="text-brand">See plans →</Link>
            </p>
          )}
        </section>
      )}

      {/* ── Följer ─────────────────────────────────────────────── */}
      <h2 className="mt-14 mb-5 font-mono text-xl">Following</h2>
      {followed.length === 0 ? (
        <p className="text-muted">
          You don&apos;t follow anyone yet. <Link href="/explore" className="text-brand">Explore communities →</Link>
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {followed.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      )}
    </PageShell>
  );
}
