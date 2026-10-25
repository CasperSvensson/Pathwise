import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { listPublishedCanvases, requireCompanyBySlug } from "@/lib/canvas/queries";
import { PageShell } from "@/components/layout/PageShell";
import { FollowButton } from "@/components/company/FollowButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Params = Promise<{ company: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { company: slug } = await params;
  return { title: slug };
}

/** Företagets publika profil: /c/{företag} */
export default async function CompanyProfilePage({ params }: { params: Params }) {
  const { company: slug } = await params;
  const company = await requireCompanyBySlug(slug);
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [canvases, { data: followerCount }, { data: follow }] = await Promise.all([
    listPublishedCanvases(company.id),
    supabase.rpc("get_follower_count", { target_company: company.id }),
    user
      ? supabase.from("follows").select("user_id").eq("company_id", company.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isOwner = user?.id === company.owner_id;

  return (
    <PageShell>
      {/* Omslag */}
      <div
        className="h-48 overflow-hidden rounded-[22px] border border-line bg-card bg-cover bg-center md:h-64"
        style={company.cover_url ? { backgroundImage: `url(${company.cover_url})` } : undefined}
      >
        {!company.cover_url && <div className="brand-gradient h-full w-full opacity-25" />}
      </div>

      {/* Namn, logotyp och knappar */}
      <div className="-mt-12 flex flex-wrap items-end justify-between gap-6 px-4 md:px-8">
        <div className="flex items-end gap-5">
          <Avatar src={company.logo_url} name={company.name} size={112} className="ring-8 ring-canvas" />
          <div className="pb-2">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.tagline && <p className="text-muted">{company.tagline}</p>}
            <p className="mt-1 font-mono text-xs text-faint">
              {Number(followerCount ?? 0)} followers {company.category && `· ${company.category}`}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pb-2">
          {isOwner ? (
            <Button href="/settings/company" variant="subtle">Edit profile</Button>
          ) : (
            <FollowButton companyId={company.id} isFollowing={!!follow} isLoggedIn={!!user} />
          )}
        </div>
      </div>

      {/* Om & vision */}
      {(company.description || company.vision) && (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {company.description && <InfoBlock title="About">{company.description}</InfoBlock>}
          {company.vision && <InfoBlock title="Vision">{company.vision}</InfoBlock>}
        </div>
      )}

      {/* Publicerade canvas */}
      <h2 className="mt-14 mb-5 font-mono text-xl">Journeys</h2>
      {canvases.length === 0 ? (
        <p className="text-muted">Nothing published yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {canvases.map((canvas) => (
            <Link
              key={canvas.id}
              href={`/c/${company.slug}/${canvas.slug}`}
              className="group flex items-center justify-between rounded-[22px] border border-line bg-surface p-6 transition hover:border-brand"
            >
              <div>
                <h3 className="text-lg font-semibold">{canvas.title}</h3>
                {canvas.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{canvas.description}</p>}
              </div>
              <Icon name="arrowRight" className="text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-line bg-surface p-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
      <p className="whitespace-pre-line">{children}</p>
    </section>
  );
}
