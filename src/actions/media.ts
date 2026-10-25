"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

/**
 * Ladda upp en bild (logotyp, omslag eller nodbild) till Supabase Storage.
 * Används överallt där man laddar upp bilder → en enda funktion.
 *
 * FormData: file (bilden), companyId
 */
export async function uploadImage(form: FormData): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "login_required", error: "Log in first." };

  const file = form.get("file");
  const companyId = form.get("companyId");

  if (!(file instanceof File) || typeof companyId !== "string") {
    return { ok: false, error: "No file selected." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: "Use PNG, JPG, WEBP, GIF or SVG." };
  if (file.size > MAX_BYTES) return { ok: false, error: "The image must be smaller than 5 MB." };

  const supabase = await createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${companyId}/${crypto.randomUUID()}.${extension}`;

  // Storage-reglerna (0004_storage.sql) kontrollerar att man är redigerare.
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: "Upload failed. Do you have access to this company?" };

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl } };
}
