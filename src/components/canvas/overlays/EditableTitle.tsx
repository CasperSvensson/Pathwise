"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * En titel som går att klicka på och skriva om direkt (som att byta namn
 * på en fil i Figma).
 *
 *   Enter / klick utanför → spara     Esc → ångra
 *
 * `onSave` returnerar ett felmeddelande, eller null om det gick bra.
 */
export function EditableTitle({
  value,
  onSave,
  minLength = 2,
  maxLength = 80,
  label = "Rename",
  textClassName = "text-lg font-semibold text-white",
  startEditing = false,
  onDone,
}: {
  value: string;
  onSave: (next: string) => Promise<string | null>;
  minLength?: number;
  maxLength?: number;
  label?: string;
  /** Typsnitt/färg – samma i visnings- och redigeringsläge. */
  textClassName?: string;
  /** Börja direkt i redigeringsläge (t.ex. efter klick på pennan i sidmenyn). */
  startEditing?: boolean;
  /** Kallas när redigeringen avslutas (sparad eller ångrad). */
  onDone?: () => void;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value); // visas direkt, innan servern svarat
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setShown(value), [value]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function start() {
    setDraft(shown);
    setError(null);
    setEditing(true);
  }

  async function commit() {
    setEditing(false);
    onDone?.();
    const next = draft.trim();
    if (next === shown) return;
    if (next.length < minLength) {
      setError(`At least ${minLength} characters.`);
      return;
    }

    const previous = shown;
    setShown(next);
    const failure = await onSave(next);
    if (failure) {
      setShown(previous); // ångra om servern sa nej
      setError(failure);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        id="editable-title"
        aria-label={label}
        value={draft}
        maxLength={maxLength}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.stopPropagation(); // stäng inte sidmenyn
            setDraft(shown);
            setEditing(false);
            onDone?.();
          }
        }}
        className={cn("block w-full min-w-40 rounded-md border border-brand bg-raised px-1.5 py-0.5 outline-none", textClassName)}
      />
    );
  }

  return (
    <span className="relative block">
      <button
        type="button"
        onClick={start}
        title={label}
        className={cn(
          "group relative flex max-w-full items-center rounded-md px-1.5 py-0.5 text-left transition",
          textClassName,
          "hover:bg-white/5 hover:ring-1 hover:ring-line-strong",
        )}
      >
        <span className="truncate">{shown}</span>
        {/* Pennan ligger utanför texten, så att den inte tar plats när den är dold */}
        <Icon
          name="pencil"
          size={12}
          className="pointer-events-none absolute top-1/2 left-full ml-0.5 -translate-y-1/2 text-muted opacity-0 transition group-hover:opacity-100"
        />
      </button>
      {error && <span className="absolute top-full left-0 mt-1 whitespace-nowrap text-xs text-danger" role="alert">{error}</span>}
    </span>
  );
}
