import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service">
      <p>Describe the rules for using the platform, subscriptions, trial period, cancellation and refunds.</p>
    </LegalPage>
  );
}
