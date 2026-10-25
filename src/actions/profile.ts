"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formText } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/** Uppdatera visningsnamn och språk. */
export async function updateProfile(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser("/settings/profile");
  const displayName = formText(form, "display_name");
  const locale = formText(form, "locale") === "sv" ? "sv" : "en";

  if (!displayName) return { ok: false, error: "Enter a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, locale })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Could not save." };

  revalidatePath("/", "layout");
  return { ok: true };
}
