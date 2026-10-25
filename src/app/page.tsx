import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

/** Startsidan (designen "HOME – inte inloggad"). */
export default function LandingPage() {
  return (
    <PageShell>
      <section className="relative flex min-h-[70dvh] flex-col items-center justify-center text-center">
        {/* Mjuk mörk glöd bakom rubriken */}
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),transparent_65%)]" />

        <h1 className="relative font-mono text-5xl leading-tight tracking-tight md:text-8xl">
          Big <strong className="font-bold text-highlight">Goals</strong>, Shared{" "}
          <strong className="font-bold text-highlight">Wins</strong>
        </h1>

        <p className="relative mt-6 max-w-2xl font-mono text-base text-fg/90 md:text-xl">{SITE.description}</p>

        <div className="relative mt-14 flex flex-col items-center gap-4 sm:flex-row">
          <Button href="/create" size="lg">
            Start communicating your journey <Icon name="arrowRight" size={22} />
          </Button>
          <Button href="/explore" variant="ghost" size="lg">
            Explore communities
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
