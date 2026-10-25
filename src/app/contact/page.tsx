import { PageShell, PageTitle } from "@/components/layout/PageShell";

export const metadata = { title: "Contact" };

// Byt till er riktiga supportadress
const SUPPORT_EMAIL = "support@example.com";

export default function ContactPage() {
  return (
    <PageShell narrow>
      <PageTitle title="Contact" subtitle="Questions, feedback or problems? We answer by email." />
      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-mono text-lg text-brand">{SUPPORT_EMAIL}</a>
    </PageShell>
  );
}
