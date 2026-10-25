import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { CompanyCard } from "@/components/company/CompanyCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { ExploreCompany } from "@/lib/types";

export const metadata = { title: "Explore" };

const SORTS = [
  { id: "popular", label: "Popular" },
  { id: "recent", label: "Recently published" },
  { id: "active", label: "Most active" },
];

type SearchParams = Promise<{ q?: string; category?: string; sort?: string }>;

/**
 * Explore: sök och filtrera bland publicerade communities.
 * Allt styrs av URL:en (?q=…&category=…&sort=…) så sökningar går att dela.
 */
export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", category, sort = "popular" } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.rpc("search_companies", {
    search_query: q,
    filter_category: category ?? null,
    sort_by: sort,
  });
  const companies = (data ?? []) as ExploreCompany[];

  // Bygg en länk som behåller övriga filter
  const linkWith = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, category, sort, ...changes };
    Object.entries(merged).forEach(([key, value]) => value && params.set(key, value));
    return `/explore?${params.toString()}`;
  };

  return (
    <PageShell>
      <PageTitle title="Explore" subtitle="Discover companies and creators building in public with their community." />

      {/* Sök */}
      <form className="mb-6 flex gap-3" action="/explore">
        <div className="relative flex-1">
          <Icon name="search" className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search companies, goals, creators…"
            className="h-12 w-full rounded-xl border border-line-strong bg-surface pr-4 pl-12 outline-none focus:border-brand"
          />
        </div>
        {category && <input type="hidden" name="category" value={category} />}
        <input type="hidden" name="sort" value={sort} />
        <Button type="submit">Search</Button>
      </form>

      {/* Kategorier + sortering */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <FilterChip href={linkWith({ category: undefined })} active={!category}>All</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c} href={linkWith({ category: c })} active={category === c}>{c}</FilterChip>
          ))}
        </div>
        <div className="flex gap-4 font-mono text-sm">
          {SORTS.map((s) => (
            <Link key={s.id} href={linkWith({ sort: s.id })} className={sort === s.id ? "text-fg" : "text-faint hover:text-muted"}>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Resultat */}
      {companies.length === 0 ? (
        <EmptyState searched={!!q || !!category} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition",
        active ? "border-brand bg-brand/15 text-fg" : "border-line-strong text-muted hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

function EmptyState({ searched }: { searched: boolean }) {
  return (
    <div className="rounded-[22px] border border-dashed border-line-strong p-12 text-center">
      <p className="text-lg">{searched ? "No communities match your search." : "No communities published yet."}</p>
      <p className="mt-2 text-muted">{searched ? "Try another word or category." : "Be the first to share your journey."}</p>
      <div className="mt-6">
        {searched ? <Button href="/explore" variant="subtle">Clear search</Button> : <Button href="/create">Create new</Button>}
      </div>
    </div>
  );
}
