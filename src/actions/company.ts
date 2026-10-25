"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getMyCompany, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/categories";
import { formText, slugify } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/**
 * Skapa ELLER uppdatera den inloggades företagsprofil (ett per konto).
 * Byter man slug sparas den gamla som omdirigering, så delade länkar fungerar.
 */
export async function saveCompany(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser("/settings/company");
  const existing = await getMyCompany();

  const name = formText(form, "name");
  const slug = slugify(formText(form, "slug") ?? name ?? "");
  const category = formText(form, "category");

  if (!name || name.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  if (!slug) return { ok: false, error: "Choose a URL name." };
  if (category && !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { ok: false, error: "Choose a category from the list." };
  }

  const fields = {
    name,
    slug,
    category,
    tagline: formText(form, "tagline"),
    description: formText(form, "description"),
    vision: formText(form, "vision"),
    logo_url: ownStorageUrl(formText(form, "logo_url")),
    cover_url: ownStorageUrl(formText(form, "cover_url")),
    is_listed: form.get("is_listed") === "on",
  };

  const supabase = await createClient();

  const { error } = existing
    ? await supabase.from("companies").update(fields).eq("id", existing.id)
    : await supabase.from("companies").insert({ ...fields, owner_id: user.id });

  if (error?.code === "23505") return { ok: false, error: "That URL name is taken. Try another." };
  if (error) return { ok: false, error: "Could not save. Try again." };

  // Slug ändrad → spara den gamla som omdirigering
  if (existing && existing.slug !== slug) {
    await supabase
      .from("company_slug_redirects")
      .upsert({ old_slug: existing.slug, company_id: existing.id }, { ignoreDuplicates: true });
    revalidatePath(`/c/${existing.slug}`);
  }

  revalidatePath(`/c/${slug}`);
  revalidatePath("/dashboard");

  // Nytt företag → vidare till att skapa första canvasen
  if (!existing) redirect("/create");
  return { ok: true };
}

/**
 * Byt bara företagsnamnet – används när man klickar på namnet i editorn.
 * Får göras av ägaren och av företagets redigerare (inte moderatorer).
 * URL-namnet (slug) ändras inte, så delade länkar fortsätter fungera.
 */
export async function renameCompany(companyId: string, rawName: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "login_required", error: "Log in first." };

  const name = rawName.trim();
  if (name.length < 2 || name.length > 80) return { ok: false, error: "The name must be 2–80 characters." };

  const supabase = await createClient();
  const { data: canEdit } = await supabase.rpc("is_company_editor", { target_company: companyId });
  if (!canEdit) return { ok: false, code: "forbidden", error: "You can't rename this company." };

  // Databasreglerna låter bara ägaren uppdatera företaget, så redigerare
  // går via admin-klienten – efter kontrollen ovan, och bara för namnet.
  const admin = createAdminClient();
  const { data: company, error } = await admin
    .from("companies")
    .update({ name })
    .eq("id", companyId)
    .select("slug")
    .single();

  if (error || !company) return { ok: false, error: "Could not save the name. Try again." };

  revalidatePath(`/c/${company.slug}`, "layout");
  revalidatePath("/dashboard");
  revalidatePath("/explore");
  return { ok: true };
}

/** Tillåt bara bildlänkar från vår egen Supabase Storage. */
function ownStorageUrl(url: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && base && url.startsWith(`${base}/storage/`) ? url : null;
}
