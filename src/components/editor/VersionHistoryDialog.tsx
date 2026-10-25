"use client";

import { useEffect, useState, useTransition } from "react";
import { listVersions, restoreVersion } from "@/actions/canvas";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { CanvasContent } from "@/lib/canvas/types";
import type { CanvasVersion } from "@/lib/types";

/**
 * Lista med publicerade versioner. "Restore" lägger tillbaka en gammal
 * version som UTKAST – den publiceras inte förrän man trycker Publish igen.
 */
export function VersionHistoryDialog({
  open,
  onClose,
  canvasId,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  canvasId: string;
  onRestored: (content: CanvasContent) => void;
}) {
  const [versions, setVersions] = useState<CanvasVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) listVersions(canvasId).then(setVersions);
  }, [open, canvasId]);

  function restore(versionId: string) {
    startTransition(async () => {
      const result = await restoreVersion(canvasId, versionId);
      if (result.ok && result.data) {
        onRestored(result.data);
        onClose();
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Version history">
      {!versions && <p className="text-sm text-muted">Loading…</p>}
      {versions?.length === 0 && <p className="text-sm text-muted">No published versions yet.</p>}

      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {versions?.map((version) => (
          <li key={version.id} className="flex items-center justify-between rounded-lg border border-line bg-raised px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Version {version.version_no}</p>
              <p className="text-xs text-muted">{new Date(version.created_at).toLocaleString()}</p>
            </div>
            <Button size="sm" variant="subtle" disabled={pending} onClick={() => restore(version.id)}>
              Restore
            </Button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  );
}
