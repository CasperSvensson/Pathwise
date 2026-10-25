import { PageShell, PageTitle } from "@/components/layout/PageShell";

/**
 * Mall för juridiska sidor. ⚠️ Texten MÅSTE granskas av en jurist före lansering.
 */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PageShell narrow>
      <PageTitle title={title} subtitle="Draft – to be reviewed before launch." />
      <div className="space-y-4 text-muted">{children}</div>
    </PageShell>
  );
}
