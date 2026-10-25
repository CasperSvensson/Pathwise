"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCanvas } from "@/actions/canvas";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { IDLE, type ActionResult } from "@/lib/types";

export function CreateCanvasForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createCanvas, IDLE);

  return (
    <form action={formAction} className="space-y-5 rounded-[22px] border border-line bg-surface p-6">
      <TextInput label="Name" name="title" placeholder="e.g. Road to 1000 pizzas" required maxLength={80} autoFocus />

      {!state.ok && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm" role="alert">
          {state.error}{" "}
          {state.code === "upgrade_required" && (
            <Link href="/settings/subscription" className="text-brand underline">See plans</Link>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create and open editor"}
      </Button>
    </form>
  );
}
