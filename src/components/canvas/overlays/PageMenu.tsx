"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EditableTitle } from "@/components/canvas/overlays/EditableTitle";
import { cn } from "@/lib/utils";
import type { PageItem } from "@/lib/types";

/**
 * Sidmenyn som öppnas med hamburgarknappen.
 *
 *   Page 1        ✎   👁   🗑
 *   Page 2        ✎   👁   🗑
 *   Page 3        ✎   ⊘   🗑      ← dold
 *   ┌ ─ ─ ─  +  ─ ─ ─ ┐            ← ny tom sida
 *
 * Alla ser listan. Pennan (byt namn), ögat, papperskorgen och "+" visas bara för redigerare
 * (när `editor` skickas in). Ögat gäller för besökare först efter Publish.
 */
export type PageMenuEditor = {
  onRename: (page: PageItem, title: string) => Promise<string | null>;
  onToggleVisible: (page: PageItem) => void;
  onDelete: (page: PageItem) => Promise<string | null>;
  onAdd: () => void;
  adding?: boolean;
  /** Sparar utkastet innan man byter sida. */
  beforeNavigate?: () => Promise<unknown>;
};

export function PageMenu({
  pages,
  currentPageId,
  pageHref,
  editor,
  onNavigate,
}: {
  pages: PageItem[];
  currentPageId: string;
  pageHref: (page: PageItem) => string;
  editor?: PageMenuEditor;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<PageItem | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  return (
    <div className="animate-slide-in w-[min(330px,calc(100vw-32px))] rounded-[var(--radius-panel)] border border-line bg-raised p-5 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
      <ul className="space-y-1">
        {pages.map((page) => {
          const isCurrent = page.id === currentPageId;
          const href = pageHref(page);

          return (
            <li key={page.id} className="group/row flex items-center gap-1">
              {editor && renamingId === page.id ? (
                <div className="min-w-0 flex-1 px-2 py-1.5">
                  <EditableTitle
                    value={page.title}
                    onSave={(title) => editor.onRename(page, title)}
                    minLength={1}
                    label={`Rename ${page.title}`}
                    textClassName={cn("text-lg text-white", isCurrent ? "font-bold" : "font-semibold")}
                    startEditing
                    onDone={() => setRenamingId(null)}
                  />
                </div>
              ) : (
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                onClick={async (e) => {
                  onNavigate();
                  if (isCurrent) return e.preventDefault();
                  if (editor?.beforeNavigate) {
                    e.preventDefault();
                    await editor.beforeNavigate();
                    router.push(href);
                  }
                }}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-2 py-1.5 transition hover:bg-white/5",
                  isCurrent ? "text-white" : "text-fg/80",
                )}
              >
                <span className={cn("block truncate text-lg", isCurrent ? "font-bold" : "font-semibold")}>{page.title}</span>
                {editor && page.visible !== page.isPublic && (
                  <span className="block text-xs text-warning">
                    {page.visible ? "Goes public on publish" : "Hidden on publish"}
                  </span>
                )}
              </Link>
              )}

              {editor && (
                <>
                  <button
                    type="button"
                    onClick={() => setRenamingId(page.id)}
                    aria-label={`Rename ${page.title}`}
                    title="Rename page"
                    className="flex h-10 w-8 items-center justify-center rounded-lg text-muted opacity-0 transition hover:bg-white/5 hover:text-fg focus-visible:opacity-100 group-hover/row:opacity-100"
                  >
                    <Icon name="pencil" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.onToggleVisible(page)}
                    aria-pressed={page.visible}
                    aria-label={page.visible ? `Hide ${page.title} from visitors` : `Show ${page.title} to visitors`}
                    title={page.visible ? "Visible to visitors (after publish)" : "Hidden from visitors"}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-white/5",
                      page.visible ? "text-fg" : "text-faint",
                    )}
                  >
                    <Icon name={page.visible ? "eye" : "eyeOff"} size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(page)}
                    disabled={pages.length <= 1}
                    aria-label={`Delete ${page.title}`}
                    title={pages.length <= 1 ? "A canvas needs at least one page" : "Delete page"}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#f08080] transition hover:bg-danger/10 disabled:opacity-30"
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {editor && (
        <button
          type="button"
          onClick={editor.onAdd}
          disabled={editor.adding}
          aria-label="Add a new blank page"
          className="mt-5 flex h-14 w-full items-center justify-center rounded-xl border-2 border-dashed border-fg/70 text-fg transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {editor.adding ? <span className="text-sm">Adding…</span> : <Icon name="plus" size={24} strokeWidth={2.4} />}
        </button>
      )}

      {editor && (
        <ConfirmDelete
          page={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={(page) => editor.onDelete(page)}
          onDone={() => setConfirming(null)}
        />
      )}
    </div>
  );
}

/** "Är du säker?" innan en sida tas bort – så att ingen raderar av misstag. */
function ConfirmDelete({
  page,
  onCancel,
  onConfirm,
  onDone,
}: {
  page: PageItem | null;
  onCancel: () => void;
  onConfirm: (page: PageItem) => Promise<string | null>;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!page) return;
    setPending(true);
    const failure = await onConfirm(page);
    setPending(false);
    if (failure) return setError(failure);
    setError(null);
    onDone();
  }

  return (
    <Modal open={!!page} onClose={onCancel} title={`Delete “${page?.title ?? ""}”?`}>
      <p className="text-muted">
        The page, its nodes and all answers from your community will be deleted permanently. This can&apos;t be undone.
      </p>
      <p className="mt-2 text-sm text-muted">If you only want to hide it, turn off its eye instead.</p>
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={confirm} disabled={pending} className="border border-danger/40">
          {pending ? "Deleting…" : "Delete page"}
        </Button>
      </div>
    </Modal>
  );
}
