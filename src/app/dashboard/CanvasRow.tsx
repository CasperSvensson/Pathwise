"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCanvas } from "@/actions/canvas";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Canvas } from "@/lib/types";

/** En rad i dashboardens canvas-lista: status, Edit, View, Delete. */
export function CanvasRow({ canvas, companySlug }: { canvas: Canvas; companySlug: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isPublished = !!canvas.published_version_id;

  function handleDelete() {
    startTransition(async () => {
      await deleteCanvas(canvas.id);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div>
        <p className="font-semibold">{canvas.title}</p>
        <p className="font-mono text-xs text-faint">
          <span className={isPublished ? "text-success" : ""}>{isPublished ? "● Published" : "○ Draft"}</span>
          {" · "}updated {new Date(canvas.updated_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-2">
        {isPublished && <Button size="sm" variant="ghost" href={`/c/${companySlug}/${canvas.slug}`}>View</Button>}
        <Button size="sm" variant="subtle" href={`/editor/${canvas.id}`}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>Delete</Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete canvas?">
        <p className="text-muted">
          “{canvas.title}” and all its answers will be deleted permanently. This can&apos;t be undone.
          {isPublished && " If you only want to hide it, unpublish it in the editor instead."}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </Modal>
    </li>
  );
}
