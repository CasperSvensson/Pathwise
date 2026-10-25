"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const RETRY_DELAYS_MS = [1000, 3000, 8000];

/**
 * Sparar automatiskt `value` en kort stund efter senaste ändringen.
 *  - Misslyckas sparningen försöker den igen (1 s, 3 s, 8 s).
 *  - Fungerar det fortfarande inte blir status "error" – användaren
 *    ser en varning och ändringarna ligger kvar i webbläsaren.
 *  - saveNow() sparar direkt (t.ex. innan publicering).
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<boolean>,
  delayMs = 1200,
): { status: SaveStatus; saveNow: () => Promise<boolean> } {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const latestValue = useRef(value);
  const isFirstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSave = useCallback(async (): Promise<boolean> => {
    setStatus("saving");

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (await save(latestValue.current)) {
        setStatus("saved");
        return true;
      }
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }

    setStatus("error");
    return false;
  }, [save]);

  // Ny ändring → vänta lite och spara sedan
  useEffect(() => {
    latestValue.current = value;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(runSave, delayMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delayMs, runSave]);

  // Varna om man stänger fliken med osparade ändringar
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (status !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    return runSave();
  }, [runSave]);

  return { status, saveNow };
}
