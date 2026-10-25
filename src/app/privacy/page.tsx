import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>Describe what personal data is collected (account, answers, follows), why, how long it is kept and how users can request deletion.</p>
      <p>Payments are handled by Stripe. Card details are never stored by us.</p>
    </LegalPage>
  );
}
