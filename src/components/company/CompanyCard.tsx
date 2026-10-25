import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

/** Kort för ett företag – används på Explore och i dashboarden. */
export function CompanyCard({
  company,
}: {
  company: {
    slug: string;
    name: string;
    tagline: string | null;
    category: string | null;
    logo_url: string | null;
    cover_url: string | null;
    follower_count?: number;
    canvas_count?: number;
  };
}) {
  return (
    <Link
      href={`/c/${company.slug}`}
      className="group block overflow-hidden rounded-[22px] border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand"
    >
      {/* Omslag eller gradient */}
      <div className="h-28 bg-card bg-cover bg-center" style={company.cover_url ? { backgroundImage: `url(${company.cover_url})` } : undefined}>
        {!company.cover_url && <div className="brand-gradient h-full w-full opacity-20" />}
      </div>

      <div className="p-5">
        <div className="-mt-12 mb-3">
          <Avatar src={company.logo_url} name={company.name} size={56} className="ring-4 ring-surface" />
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold group-hover:text-white">{company.name}</h3>
          {company.category && (
            <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-muted">{company.category}</span>
          )}
        </div>

        {company.tagline && <p className="mt-1 line-clamp-2 text-sm text-muted">{company.tagline}</p>}

        {company.follower_count !== undefined && (
          <p className="mt-4 font-mono text-xs text-faint">
            {company.follower_count} followers · {company.canvas_count ?? 0} canvas
          </p>
        )}
      </div>
    </Link>
  );
}
