"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImage } from "@/actions/media";
import { Icon } from "@/components/ui/Icon";

/**
 * Bilduppladdning – används för nodbilder, logotyp och omslag.
 * Visar "+ Upload custom image" (streckad ruta) eller den valda bilden.
 */
export function ImageUpload({
  companyId,
  value,
  onChange,
  label = "Upload custom image",
}: {
  companyId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("companyId", companyId);

    startTransition(async () => {
      const result = await uploadImage(form);
      if (result.ok && result.data) {
        onChange(result.data.url);
        setError(null);
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-raised p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-12 w-12 rounded-lg object-cover" />
          <button type="button" onClick={() => inputRef.current?.click()} className="text-sm text-brand">
            Replace
          </button>
          <button type="button" onClick={() => onChange(null)} className="ml-auto text-sm text-muted hover:text-danger">
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-raised py-3.5 text-[15px] text-muted transition hover:border-brand hover:text-fg"
        >
          <Icon name="plus" size={18} />
          {pending ? "Uploading…" : label}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
