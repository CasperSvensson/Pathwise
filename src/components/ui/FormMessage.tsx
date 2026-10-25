import { IDLE, type ActionResult } from "@/lib/types";

/**
 * Visar resultatet från en server action under ett formulär:
 * rött fel, eller grön bekräftelse om `successText` anges.
 * Inget visas innan formuläret skickats (state === IDLE).
 */
export function FormMessage({ state, successText }: { state: ActionResult; successText?: string }) {
  if (state === IDLE) return null;

  if (!state.ok) {
    return <p className="text-sm text-danger" role="alert">{state.error}</p>;
  }
  return successText ? <p className="text-sm text-success" role="status">{successText}</p> : null;
}
