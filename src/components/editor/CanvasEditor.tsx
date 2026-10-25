"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addEdge,
  reconnectEdge,
  ReactFlowProvider,
  useEdgesState,
  useConnection,
  useNodesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type OnConnectEnd,
  type OnReconnectEnd,
} from "@xyflow/react";
import { addPage, deleteCanvas, renamePage, saveDraft, setPageVisibility } from "@/actions/canvas";
import { renameCompany } from "@/actions/company";
import { CanvasBoard } from "@/components/canvas/CanvasBoard";
import { CanvasRuntimeProvider } from "@/components/canvas/CanvasRuntime";
import { fromFlow, normalizeContent, toFlow } from "@/components/canvas/flow";
import { CanvasTopBar } from "@/components/canvas/overlays/CanvasTopBar";
import { KeyboardHints } from "@/components/canvas/overlays/KeyboardHints";
import { UserMenu } from "@/components/canvas/overlays/UserMenu";
import { ZoomControls } from "@/components/canvas/overlays/ZoomControls";
import { NodeInspector } from "@/components/editor/NodeInspector";
import { PublishDialog } from "@/components/editor/PublishDialog";
import { SaveStatusBadge } from "@/components/editor/SaveStatusBadge";
import { useAutosave } from "@/components/editor/useAutosave";
import { VersionHistoryDialog } from "@/components/editor/VersionHistoryDialog";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { canvasFingerprint, createGoalNode, newId } from "@/lib/canvas/content";
import { NEW_GOAL_SIZE, OPPOSITE_SIDE, nearestDropTarget, placeBeside, type DropTarget, type Rect } from "@/lib/canvas/layout";
import type { CanvasContent, GoalNodeData, HandleSide } from "@/lib/canvas/types";
import type { CurrentUser } from "@/lib/auth";
import type { PlanId } from "@/lib/plans";
import type { Canvas, Company, PageItem } from "@/lib/types";

/**
 * ════════════════════════════════════════════════════════════════
 *  CANVAS-EDITORN
 *
 *  Håller noder och pilar i minnet, sparar automatiskt som utkast
 *  och öppnar högerpanelen när man klickar på en nod.
 *
 *  Skapa noder:   klicka på ett handtag på en vald nod (ny nod åt det
 *                 hållet). START-noden kan inte tas bort, så det finns
 *                 alltid en nod att utgå från.
 *  Koppla noder:  dra från ett handtag till en annan nod.
 *  Pilar:         klicka för att välja, ⌫ för att ta bort, dra en
 *                 ände till en annan nod för att flytta pilen.
 * ════════════════════════════════════════════════════════════════
 */

type Props = {
  canvas: Canvas;
  company: Company;
  initialContent: CanvasContent;
  /** Den version besökarna ser just nu (null = aldrig publicerad). */
  publishedContent: CanvasContent | null;
  user: CurrentUser;
  planId: PlanId;
  /** Alla sidor i företaget (sidmenyn). */
  pages: PageItem[];
  /** Bakåtpilen: dashboard eller Explore. */
  backHref: string;
};

// ReactFlowProvider behövs för att kunna använda useReactFlow() nedan.
export function CanvasEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}

function EditorInner({ canvas, company, initialContent, publishedContent, user, planId, pages: initialPages, backHref }: Props) {
  const initial = useMemo(() => toFlow(initialContent), [initialContent]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { getNode, getNodes } = useReactFlow();


  // ── Autosave ─────────────────────────────────────────────────
  // Bara det vi faktiskt sparar räknas som ändring (inte "vald nod" osv.)
  const content = useMemo(() => fromFlow(nodes, edges), [nodes, edges]);
  const contentKey = JSON.stringify(content);

  const save = useCallback(
    async (json: string) => (await saveDraft(canvas.id, JSON.parse(json))).ok,
    [canvas.id],
  );
  const { status, saveNow } = useAutosave(contentKey, save);


  // ── Finns det något nytt att publicera? ──────────────────────
  // Jämför utkastet med den publicerade versionen. Aldrig publicerad = alltid nytt.
  const [publishedFingerprint, setPublishedFingerprint] = useState(
    // normalizeContent: samma form som editorn sparar, så att t.ex. äldre
    // pilar utan sidor inte räknas som en ändring
    publishedContent ? canvasFingerprint(normalizeContent(publishedContent)) : null,
  );
  const contentChanged = publishedFingerprint !== canvasFingerprint(content);


  // ── Sidmenyn (☰): synlighet, ny sida, ta bort ─────────────────
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [addingPage, setAddingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null); // t.ex. plangräns vid "+"
  const thisPage = pages.find((p) => p.id === canvas.id);
  const pageVisible = thisPage?.visible ?? false;

  // Publish behövs om: en synlig sida har nytt innehåll, eller ett öga har ändrats.
  const visibilityChanged = pages.some((p) => p.visible !== p.isPublic);
  const hasUnpublishedChanges = (pageVisible && contentChanged) || visibilityChanged;

  /** Byt sidnamn – samma funktion från toppbaren och från sidmenyn. */
  const renamePageTitle = useCallback(async (page: PageItem, title: string): Promise<string | null> => {
    const setTitle = (value: string) =>
      setPages((current) => current.map((p) => (p.id === page.id ? { ...p, title: value } : p)));
    setTitle(title.trim());
    const result = await renamePage(page.id, title);
    if (result.ok) return null;
    setTitle(page.title);
    return result.error;
  }, []);

  const toggleVisible = useCallback(async (page: PageItem) => {
    const flip = (visible: boolean) =>
      setPages((current) => current.map((p) => (p.id === page.id ? { ...p, visible } : p)));
    flip(!page.visible); // direkt i gränssnittet …
    const result = await setPageVisibility(page.id, !page.visible);
    if (!result.ok) flip(page.visible); // … och tillbaka om servern sa nej
  }, []);

  const removePage = useCallback(
    async (page: PageItem): Promise<string | null> => {
      const result = await deleteCanvas(page.id);
      if (!result.ok) return result.error;

      const remaining = pages.filter((p) => p.id !== page.id);
      setPages(remaining);
      // Tog man bort sidan man står på? Gå till första kvarvarande.
      if (page.id === canvas.id) router.push(remaining[0] ? `/editor/${remaining[0].id}` : "/dashboard");
      return null;
    },
    [pages, canvas.id, router],
  );

  const addBlankPage = useCallback(async () => {
    setAddingPage(true);
    await saveNow(); // spara den här sidan innan vi lämnar den
    const result = await addPage(canvas.id);
    setAddingPage(false);
    if (result.ok && result.data) return router.push(`/editor/${result.data.id}`);
    if (!result.ok) {
      setPageError(result.error);
      setTimeout(() => setPageError(null), 5000);
    }
  }, [canvas.id, router, saveNow]);


  // ── Nodoperationer ───────────────────────────────────────────
  const updateNodeData = useCallback(
    (nodeId: string, patch: Partial<GoalNodeData>) =>
      setNodes((current) => current.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))),
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => current.filter((n) => n.id !== nodeId));
      setEdges((current) => current.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedId(null);
    },
    [setNodes, setEdges],
  );

  const connect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge({ ...connection, id: newId("edge") }, current)),
    [setEdges],
  );

  /** Nodens position och uppmätta storlek. */
  const nodeRect = useCallback(
    (nodeId: string): Rect | null => {
      const node = getNode(nodeId);
      if (!node) return null;
      return {
        ...node.position,
        width: node.measured?.width ?? NEW_GOAL_SIZE.width,
        height: node.measured?.height ?? NEW_GOAL_SIZE.height,
      };
    },
    [getNode],
  );

  /** Klick på ett handtag: ny nod på den sidan, kopplad med en pil. */
  const addNodeBeside = useCallback(
    (fromId: string, side: HandleSide) => {
      const from = nodeRect(fromId);
      if (!from) return;

      const node = createGoalNode(placeBeside(from, side));
      setNodes((current) => [...current.map((n) => ({ ...n, selected: false })), { ...node, selected: true }]);
      setEdges((current) => [
        ...current,
        { id: newId("edge"), source: fromId, sourceHandle: side, target: node.id, targetHandle: OPPOSITE_SIDE[side] },
      ]);
      setSelectedId(node.id);
    },
    [nodeRect, setNodes, setEdges],
  );

  /**
   * Medan en pil dras (ny eller flyttad): närmaste nod och sida.
   * Noden visar då sina handtag och det närmaste lyser – där fäster pilen
   * när man släpper. Räknas om när pekaren rör sig.
   */
  const dropTarget = useConnection((connection): DropTarget | null => {
    if (!connection.inProgress) return null;
    const rects = getNodes().map((n) => ({
      id: n.id,
      rect: {
        ...n.position,
        width: n.measured?.width ?? NEW_GOAL_SIZE.width,
        height: n.measured?.height ?? NEW_GOAL_SIZE.height,
      },
    }));
    return nearestDropTarget(rects, connection.to, connection.fromNode.id);
  });

  // Vid släpp har React Flow redan nollställt draget – spara senaste målet här.
  const lastDropTarget = useRef<DropTarget | null>(null);
  if (dropTarget) lastDropTarget.current = dropTarget;

  /** Tar (och glömmer) målet som visades när pilen släpptes. */
  const takeDropTarget = () => {
    const target = lastDropTarget.current;
    lastDropTarget.current = null;
    return target;
  };

  /** Ny pil släpptes nära en nod (men inte exakt på ett handtag) → koppla till det markerade handtaget. */
  const connectToDroppedNode: OnConnectEnd = useCallback((_event, state) => {
    const target = takeDropTarget();
    if (state.isValid || !state.fromNode || !target) return;

    connect({
      source: state.fromNode.id,
      sourceHandle: state.fromHandle?.id ?? "right",
      target: target.nodeId,
      targetHandle: target.side,
    });
  }, [connect]);

  /** En befintlig pils ände drogs till ett handtag på en annan nod. */
  const reconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => setEdges((current) => reconnectEdge(oldEdge, connection, current)),
    [setEdges],
  );

  /** En pils ände släpptes nära en nod (men inte exakt på ett handtag) → flytta den till det markerade handtaget. */
  const reconnectToDroppedNode: OnReconnectEnd = useCallback(
    (_event, edge, _handleType, state) => {
      const target = takeDropTarget();
      if (state.isValid || !state.fromNode || !target) return;

      // Draget börjar alltid i den ände som står still
      const movedTarget = state.fromNode.id === edge.source;

      reconnect(
        edge,
        movedTarget
          ? { source: edge.source, sourceHandle: edge.sourceHandle ?? null, target: target.nodeId, targetHandle: target.side }
          : { source: target.nodeId, sourceHandle: target.side, target: edge.target, targetHandle: edge.targetHandle ?? null },
      );
    },
    [reconnect],
  );

  const restoreContent = useCallback(
    (restored: CanvasContent) => {
      const flow = toFlow(restored);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setSelectedId(null);
    },
    [setNodes, setEdges],
  );

  const selectedNode = nodes.find((n) => n.id === selectedId && n.type === "goal");


  // ── Vy ───────────────────────────────────────────────────────
  return (
    <CanvasRuntimeProvider value={{ editable: true, onAddBeside: addNodeBeside, dropTarget }}>
      <CanvasBoard
        nodes={nodes}
        edges={edges}
        editable
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={connect}
        onConnectEnd={connectToDroppedNode}
        onReconnect={reconnect}
        onReconnectEnd={reconnectToDroppedNode}
        onEdgeClick={() => setSelectedId(null)}
        onNodeClick={(id) => setSelectedId(id)}
        onPaneClick={() => setSelectedId(null)}
      >
        <CanvasTopBar
          companyName={company.name}
          companyHref={`/c/${company.slug}`}
          pageTitle={thisPage?.title ?? canvas.title}
          backHref={backHref}
          pages={pages}
          currentPageId={canvas.id}
          pageHref={(page) => `/editor/${page.id}`}
          onRenameCompany={async (name) => {
            const result = await renameCompany(company.id, name);
            return result.ok ? null : result.error;
          }}
          onRenamePage={async (title) => (thisPage ? renamePageTitle(thisPage, title) : "Page not found.")}
          pageEditor={{
            onRename: renamePageTitle,
            onToggleVisible: toggleVisible,
            onDelete: removePage,
            onAdd: addBlankPage,
            adding: addingPage,
            beforeNavigate: saveNow,
          }}
          actions={
            <>
              <SaveStatusBadge status={status} onRetry={saveNow} />
              <span className="hidden md:block">
                <ToolbarButton icon="history" label="Version history" onClick={() => setHistoryOpen(true)} />
              </span>
              <PublishButton hasChanges={hasUnpublishedChanges} onClick={() => setPublishOpen(true)} />
              <span className="hidden md:block">
                <UserMenu user={user} />
              </span>
            </>
          }
        />
        <KeyboardHints editable />
        <ZoomControls />
      </CanvasBoard>

      {pageError && (
        <p role="alert" className="fixed top-28 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-danger/40 bg-surface px-4 py-2 text-sm text-danger shadow-xl">
          {pageError}
        </p>
      )}

      {selectedNode && (
        <NodeInspector
          key={selectedNode.id}
          canvasId={canvas.id}
          companyId={company.id}
          planId={planId}
          nodeId={selectedNode.id}
          data={selectedNode.data as GoalNodeData}
          onChange={(patch) => updateNodeData(selectedNode.id, patch)}
          onDelete={() => deleteNode(selectedNode.id)}
          onClose={() => setSelectedId(null)}
        />
      )}

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        canvas={{ ...canvas, title: thisPage?.title ?? canvas.title }}
        companySlug={company.slug}
        beforePublish={saveNow}
        pageVisible={pageVisible}
        onPublished={() => {
          // Synlig sida: innehållet är nu live. Alla ögon är nu verkställda.
          if (pageVisible) setPublishedFingerprint(canvasFingerprint(content));
          setPages((current) => current.map((p) => ({ ...p, isPublic: p.visible })));
        }}
      />

      <VersionHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        canvasId={canvas.id}
        onRestored={restoreContent}
      />
    </CanvasRuntimeProvider>
  );
}

/** Rund ikonknapp i toppbaren. */
function ToolbarButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line-strong text-fg transition hover:bg-white/5"
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

/**
 * Publish-knappen. Lyser bara när utkastet skiljer sig från det publicerade.
 * Utan ändringar är den gråad men går fortfarande att öppna (för att avpublicera).
 */
function PublishButton({ hasChanges, onClick }: { hasChanges: boolean; onClick: () => void }) {
  if (hasChanges) return <Button onClick={onClick}>Publish</Button>;

  return (
    <Button
      variant="subtle"
      onClick={onClick}
      title="No changes since the last publish"
      className="font-mono text-faint hover:text-muted"
    >
      <Icon name="check" size={16} /> Published
    </Button>
  );
}
