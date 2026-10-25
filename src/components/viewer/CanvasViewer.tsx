"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { submitResponse } from "@/actions/responses";
import { CanvasBoard } from "@/components/canvas/CanvasBoard";
import { CanvasRuntimeProvider, type CanvasRespondFn } from "@/components/canvas/CanvasRuntime";
import { toFlow } from "@/components/canvas/flow";
import { CanvasTopBar } from "@/components/canvas/overlays/CanvasTopBar";
import { KeyboardHints } from "@/components/canvas/overlays/KeyboardHints";
import { UserMenu } from "@/components/canvas/overlays/UserMenu";
import { ZoomControls } from "@/components/canvas/overlays/ZoomControls";
import { NodeDetailPanel } from "@/components/viewer/NodeDetailPanel";
import { Button } from "@/components/ui/Button";
import type { CanvasWidgetState } from "@/components/widgets/types";
import type { CanvasContent, GoalNode } from "@/lib/canvas/types";
import type { CurrentUser } from "@/lib/auth";
import type { Canvas, Company, PageItem } from "@/lib/types";

/**
 * Besökarens vy av en publicerad canvas (designen "Free User – Viewing").
 * Man kan panorera, zooma, klicka på noder och svara på widgets.
 */
type Props = {
  company: Company;
  canvas: Canvas;
  content: CanvasContent;
  widgetState: CanvasWidgetState;
  user: CurrentUser | null;
  canEdit: boolean;
  /** Publika sidor (sidmenyn). */
  pages: PageItem[];
  /** Bakåtpilen: dashboard (betalande) eller Explore. */
  backHref: string;
};

export function CanvasViewer({ company, canvas, content, widgetState, user, canEdit, pages, backHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { nodes, edges } = useMemo(() => toFlow(content), [content]);
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);

  const openNode = content.nodes.find((n): n is GoalNode => n.id === openNodeId && n.type === "goal");

  // Svar från en widget → servern. Utloggad? Skicka till inloggning och tillbaka hit.
  const respond: CanvasRespondFn = async (nodeId, widget, value) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return null;
    }

    const result = await submitResponse({ canvasId: canvas.id, nodeId, widgetId: widget.id, value });
    if (!result.ok) return result.error;

    router.refresh(); // hämta nya siffror från servern
    return null;
  };

  return (
    <ReactFlowProvider>
      <CanvasRuntimeProvider value={{ editable: false, widgetState, onRespond: respond }}>
        <CanvasBoard
          nodes={nodes}
          edges={edges}
          editable={false}
          onNodeClick={(id) => setOpenNodeId(id)}
          onPaneClick={() => setOpenNodeId(null)}
        >
          <CanvasTopBar
            companyName={company.name}
            companyHref={`/c/${company.slug}`}
            pageTitle={canvas.title}
            backHref={backHref}
            pages={pages}
            currentPageId={canvas.id}
            pageHref={(page) => `/c/${company.slug}/${page.slug}`}
            actions={
              <>
                {canEdit ? (
                  <Button href={`/editor/${canvas.id}`}>Edit</Button>
                ) : (
                  // Döljs på mobil via en omslutande span: Buttons egen "inline-flex" skulle annars vinna över "hidden"
                  <span className="hidden sm:block">
                    <Button href="/create">Create new</Button>
                  </span>
                )}
                <UserMenu user={user} loginNext={pathname} />
              </>
            }
          />
          <KeyboardHints editable={false} />
          <ZoomControls />
        </CanvasBoard>

        {openNode && (
          <NodeDetailPanel
            node={openNode}
            widgetState={widgetState}
            onRespond={respond}
            onClose={() => setOpenNodeId(null)}
          />
        )}
      </CanvasRuntimeProvider>
    </ReactFlowProvider>
  );
}
