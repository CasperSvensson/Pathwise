import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/site";

export const metadata = { title: "About" };

const STEPS = [
  {
    title: "Share your goals",
    text: "Companies and creators map out their journey on an interactive canvas – goals, milestones and what happens when they're reached.",
  },
  {
    title: "Let the community in",
    text: "Customers follow along, vote, rate ideas and give feedback directly on each goal.",
  },
  {
    title: "Win together",
    text: "When a milestone is reached, everyone sees it. Engagement turns into loyalty and long-term growth.",
  },
];

export default function AboutPage() {
  return (
    <PageShell narrow>
      <PageTitle title={`About ${SITE.name}`} subtitle={SITE.description} />

      <ol className="space-y-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-[22px] border border-line bg-surface p-6">
            <p className="font-mono text-sm text-highlight">0{i + 1}</p>
            <h2 className="mt-1 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-muted">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex gap-4">
        <Button href="/explore">Explore communities</Button>
        <Button href="/create" variant="subtle">Create your own</Button>
      </div>
    </PageShell>
  );
}
