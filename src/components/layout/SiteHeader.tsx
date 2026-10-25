import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { BrandBadge } from "@/components/ui/BrandBadge";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/canvas/overlays/UserMenu";

/** Toppmenyn på vanliga sidor (landing, explore, about, dashboard …). */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-12 md:pt-8">
      <nav className="flex items-center justify-between rounded-[22px] border border-line bg-surface/90 px-4 py-3 backdrop-blur md:px-8 md:py-4">
        <BrandBadge title={SITE.name} />

        <div className="flex items-center gap-1 md:gap-6">
          {/* Döljs på mobil (span runt, eftersom Buttons "inline-flex" annars vinner över "hidden") */}
          <span className="hidden gap-1 sm:flex md:gap-6">
            <Button variant="ghost" href="/explore">Explore</Button>
            <Button variant="ghost" href="/about">About</Button>
          </span>
          <Button href="/create" className="md:mx-6">Create new</Button>
          <UserMenu user={user} />
        </div>
      </nav>
    </header>
  );
}
