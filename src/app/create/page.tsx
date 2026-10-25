import { redirect } from "next/navigation";
import { getMyCompany, requireUser } from "@/lib/auth";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { CreateCanvasForm } from "@/app/create/CreateCanvasForm";

export const metadata = { title: "Create new" };

/**
 * "Create new":
 *  1. Inte inloggad?          → proxy.ts skickar till /login
 *  2. Inget företag än?       → skapa företagsprofil först
 *  3. Annars                  → namnge canvasen och öppna editorn
 */
export default async function CreatePage() {
  await requireUser("/create");

  const company = await getMyCompany();
  if (!company) redirect("/settings/company?welcome=1");

  return (
    <PageShell narrow>
      <PageTitle title="New canvas" subtitle={`A new journey for ${company.name}. You can change everything later.`} />
      <CreateCanvasForm />
    </PageShell>
  );
}
