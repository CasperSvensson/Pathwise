"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Panel as FlowPanel } from "@xyflow/react";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";
import { EditableTitle } from "@/components/canvas/overlays/EditableTitle";
import { PageMenu, type PageMenuEditor } from "@/components/canvas/overlays/PageMenu";
import type { PageItem } from "@/lib/types";

/**
 * Toppen av canvasen:
 *
 *   ←   ┌──────────────────────┐                       ┌──────────────────┐
 *       │ ☰  Califactory        │                       │  Publish  (C) ⚙  │
 *       │    Page 1             │                       └──────────────────┘
 *       └──────────────────────┘
 *         └ sidmenyn öppnas här
 *
 * ←   tillbaka (dashboard för betalande, annars Explore)
 * ☰   sidmenyn – alla ser sidorna, redigerare kan även dölja/ta bort/lägga till
 * Med `onRenameCompany` / `onRenamePage` (editorn) går företagsnamnet och
 * sidnamnet att klicka på och skriva om.
 */
/** Båda toppanelerna får exakt samma höjd, oavsett innehåll. */
const BAR_HEIGHT = "h-[72px] md:h-[76px]";

/** Luft i vänstra rutan (☰ + namn): 8 px kant / 6 px mellan (mobil), 14 px / 10 px (dator). */
const LEFT_BAR_SPACING = "flex items-center gap-1.5 px-2 md:gap-2.5 md:px-3.5";

/** Luft i högra rutan (Publish, avatar …): 16 px kant / 12 px mellan (mobil), 28 px / 20 px (dator). */
const RIGHT_BAR_SPACING = "flex items-center gap-3 px-4 md:gap-5 md:px-7";

type Props = {
  companyName: string;
  /** Klick på företagsnamnet (besökare) → företagets profil. */
  companyHref: string;
  pageTitle: string;
  backHref: string;
  pages: PageItem[];
  currentPageId: string;
  pageHref: (page: PageItem) => string;
  actions: ReactNode;
  /** Bara i editorn. */
  onRenameCompany?: (name: string) => Promise<string | null>;
  onRenamePage?: (title: string) => Promise<string | null>;
  pageEditor?: PageMenuEditor;
};

export function CanvasTopBar({
  companyName,
  companyHref,
  pageTitle,
  backHref,
  pages,
  currentPageId,
  pageHref,
  actions,
  onRenameCompany,
  onRenamePage,
  pageEditor,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Stäng menyn med Esc eller klick utanför (men inte i bekräftelsedialogen)
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (menuRef.current?.contains(target) || target.closest("[data-modal-overlay]")) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[data-modal-overlay]") && setMenuOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <FlowPanel position="top-left" className="!m-4 md:!m-6">
        <div ref={menuRef} className="flex items-start gap-2 md:gap-5">
          <Link
            href={backHref}
            aria-label="Back"
            title="Back"
            // Centrerad mot panelen: (72 − 44) / 2 = 14 px, (76 − 44) / 2 = 16 px
            className="mt-3.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10 md:mt-4"
          >
            <Icon name="arrowLeft" size={30} strokeWidth={1.8} />
          </Link>

          <div className="space-y-3">
            <Panel className={`${LEFT_BAR_SPACING} ${BAR_HEIGHT}`}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label="Pages"
                title="Pages"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
              >
                <Icon name="menu" size={26} strokeWidth={1.6} />
              </button>

              {/* -mx-1.5 tar ut namnens egen hover-padding, så att avstånden blir exakt som i högra rutan */}
              <span className="-mx-1.5 hidden w-max max-w-[18rem] leading-tight sm:block">
                {onRenameCompany ? (
                  <EditableTitle value={companyName} onSave={onRenameCompany} label="Rename company" />
                ) : (
                  <Link href={companyHref} className="block truncate px-1.5 text-lg font-semibold text-white hover:underline">
                    {companyName}
                  </Link>
                )}
                {onRenamePage ? (
                  <EditableTitle
                    value={pageTitle}
                    onSave={onRenamePage}
                    minLength={1}
                    label="Rename page"
                    textClassName="text-sm font-semibold text-muted"
                  />
                ) : (
                  <span className="block truncate px-1.5 text-sm font-semibold text-muted">{pageTitle}</span>
                )}
              </span>
            </Panel>

            {menuOpen && (
              <div className="sm:ml-10">
                <PageMenu
                  pages={pages}
                  currentPageId={currentPageId}
                  pageHref={pageHref}
                  editor={pageEditor}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </FlowPanel>

      <FlowPanel position="top-right" className="!m-4 md:!m-6">
        <Panel className={`${RIGHT_BAR_SPACING} ${BAR_HEIGHT}`}>{actions}</Panel>
      </FlowPanel>
    </>
  );
}
