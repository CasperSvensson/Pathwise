import { notFound } from "next/navigation";
import { getEditableCanvas, getPlanForUser } from "@/lib/auth";
import { getDraftContent, getVersionContentForEditor, listCompanyPages } from "@/lib/canvas/queries";
import { backHrefForPlan } from "@/lib/plans";
import { CanvasEditor } from "@/components/editor/CanvasEditor";

export const metadata = { title: "Editor" };

/**
 * Editorn: /editor/{canvasId}
 * Bara ägare och redigerare kommer in – andra får 404 (vi avslöjar inte
 * ens att canvasen finns).
 */
export default async function EditorPage({ params }: { params: Promise<{ canvasId: string }> }) {
  const { canvasId } = await params;

  const access = await getEditableCanvas(canvasId);
  if (!access) notFound();

  const [content, publishedContent, pages, { plan: myPlan }] = await Promise.all([
    getDraftContent(canvasId),
    getVersionContentForEditor(canvasId, access.canvas.published_version_id),
    listCompanyPages(access.company.id),
    getPlanForUser(access.user.id), // bakåtpilen följer DIN plan, inte ägarens
  ]);

  return (
    <CanvasEditor
      key={canvasId}
      canvas={access.canvas}
      company={access.company}
      initialContent={content}
      publishedContent={publishedContent}
      user={access.user}
      planId={access.plan.id}
      pages={pages}
      backHref={backHrefForPlan(myPlan.id)}
    />
  );
}
