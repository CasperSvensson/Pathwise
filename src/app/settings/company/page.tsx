import { getMyCompany } from "@/lib/auth";
import { PageTitle } from "@/components/layout/PageShell";
import { CompanyForm } from "@/app/settings/company/CompanyForm";

export const metadata = { title: "Company page" };

/** Skapa eller redigera sin publika företagssida. */
export default async function CompanySettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const company = await getMyCompany();

  return (
    <>
      <PageTitle
        title={company ? "Company page" : "Create your company page"}
        subtitle={
          welcome && !company
            ? "First, tell your community who you are. Then you'll build your first canvas."
            : "This is what visitors see on your public profile."
        }
      />
      <CompanyForm company={company} />
    </>
  );
}
