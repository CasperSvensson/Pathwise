import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getPlanForUser } from "@/lib/auth";
import { getCanvasWidgetState, getPublishedCanvas, listPublishedCanvases, requireCompanyBySlug, toPageItem } from "@/lib/canvas/queries";
import { backHrefForPlan } from "@/lib/plans";
import { CanvasViewer } from "@/components/viewer/CanvasViewer";

type Params = Promise<{ company: string; canvas: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { company, canvas } = await params;
  return { title: `${canvas} – ${company}` };
}

/**
 * En publicerad canvas: /c/{företag}/{canvas}
 * Detta är länken man delar med sitt community.
 */
export default async function CanvasPage({ params }: { params: Params }) {
  const { company: companySlug, canvas: canvasSlug } = await params;
  const company = await requireCompanyBySlug(companySlug, `/${canvasSlug}`);

  const published = await getPublishedCanvas(company.id, canvasSlug);
  if (!published) notFound();

  const user = await getCurrentUser();
  const [widgetState, publicPages, myPlan] = await Promise.all([
    getCanvasWidgetState(published.canvas.id, user?.id ?? null),
    listPublishedCanvases(company.id),
    user ? getPlanForUser(user.id).then((r) => r.plan.id) : Promise.resolve(null),
  ]);

  // Visa "Edit"-knappen för den som får redigera (kontrolleras igen i editorn)
  const supabase = await createClient();
  const { data: canEdit } = user
    ? await supabase.rpc("is_company_editor", { target_company: company.id })
    : { data: false };

  return (
    <CanvasViewer
      company={company}
      canvas={published.canvas}
      content={published.content}
      widgetState={widgetState}
      user={user}
      canEdit={!!canEdit}
      pages={publicPages.map(toPageItem)}
      backHref={backHrefForPlan(myPlan)}
    />
  );
}
