"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

/** Följ eller sluta följa ett företag. */
export async function setFollowing(companyId: string, follow: boolean, pathToRefresh: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "login_required", error: "Log in to follow." };

  const supabase = await createClient();

  const { error } = follow
    ? await supabase.from("follows").upsert({ user_id: user.id, company_id: companyId }, { ignoreDuplicates: true })
    : await supabase.from("follows").delete().eq("user_id", user.id).eq("company_id", companyId);

  if (error) return { ok: false, error: "Something went wrong. Try again." };

  revalidatePath(pathToRefresh);
  return { ok: true };
}
