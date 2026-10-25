"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishCanvas, updateCanvasDetails } from "@/actions/canvas";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextArea, TextInput } from "@/components/ui/Field";
import { siteUrl, slugify } from "@/lib/utils";
import type { Canvas } from "@/lib/types";

/**
 * Publiceringsflödet:
 *   1. Kontrollera titel, URL och beskrivning
 *   2. Bekräfta → servern kontrollerar plan, publicerar sidan och
 *      verkställer ögonen i sidmenyn (synliga/dolda sidor)
 *   3. Klart → visa delbar länk (eller att sidan är dold)
 *
 * Saknar man rätt plan visas uppgraderingsläget. Inget arbete går förlorat –
 * utkastet ligger kvar.
 */
type Step = "details" | "upgrade" | "done";

export function PublishDialog({
  open,
  onClose,
  canvas,
  companySlug,
  beforePublish,
  onPublished,
  pageVisible,
}: {
  open: boolean;
  onClose: () => void;
  canvas: Canvas;
  companySlug: string;
  /** Sparar utkastet först, så att det senaste publiceras. */
  beforePublish: () => Promise<boolean>;
  /** Anropas när publiceringen lyckats. */
  onPublished?: () => void;
  /** Är den här sidan markerad som synlig (ögat i sidmenyn)? */
  pageVisible: boolean;
}) {
  const [step, setStep] = useState<Step>("details");
  const [slug, setSlug] = useState(canvas.slug);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handlePublish(form: FormData) {
    startTransition(async () => {
      setError(null);

      const details = await updateCanvasDetails(canvas.id, form);
      if (!details.ok) return setError(details.error);

      if (!(await beforePublish())) return setError("Could not save your latest changes. Try again.");

      const result = await publishCanvas(canvas.id);
      if (result.ok) {
        setPublishedUrl(result.data?.url ?? null);
        setStep("done");
        onPublished?.();
        router.refresh(); // hämta ny publiceringsstatus
      } else if (result.code === "upgrade_required") {
        setError(result.error);
        setStep("upgrade");
      } else {
        setError(result.error);
      }
    });
  }

  const close = () => {
    setStep("details");
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title={step === "done" ? "Published 🎉" : "Publish"}>
      {step === "details" && (
        <form action={handlePublish} className="space-y-4">
          <TextInput label="Title" name="title" defaultValue={canvas.title} required maxLength={80} />
          <TextInput
            label="URL"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            hint={siteUrl(`/c/${companySlug}/${slug || "…"}`)}
            required
          />
          <TextArea label="Short description" name="description" defaultValue={canvas.description ?? ""} maxLength={280} />

          {!pageVisible && (
            <p className="rounded-lg border border-line-strong bg-raised p-3 text-sm text-muted">
              This page is hidden. Publishing saves your other pages&apos; visibility, but this one stays private.
              Turn on its eye in the page menu to make it public.
            </p>
          )}

          {error && <p className="text-sm text-danger" role="alert">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </form>
      )}

      {step === "upgrade" && (
        <div className="space-y-4">
          <p className="text-muted">{error}</p>
          <p className="text-sm text-muted">Don&apos;t worry – everything you&apos;ve made is saved as a draft.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={close}>Keep editing</Button>
            <Button href="/settings/subscription">See plans</Button>
          </div>
        </div>
      )}

      {step === "done" && !publishedUrl && (
        <div className="space-y-4">
          <p className="text-muted">Your changes are published. This page is hidden, so only editors can see it.</p>
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      )}

      {step === "done" && publishedUrl && (
        <div className="space-y-4">
          <p className="text-muted">Your canvas is live. Share the link with your community:</p>
          <code className="block break-all rounded-lg bg-raised p-3 text-sm">{siteUrl(publishedUrl)}</code>
          <div className="flex justify-end gap-3">
            <Button variant="subtle" onClick={() => navigator.clipboard.writeText(siteUrl(publishedUrl))}>
              Copy link
            </Button>
            <Button href={publishedUrl}>Open</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
