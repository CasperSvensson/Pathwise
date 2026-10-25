"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formText, safeNextPath, siteUrl } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/**
 * ════════════════════════════════════════════════════════════════
 *  INLOGGNING – Supabase Auth sköter lösenord, e-postverifiering
 *  och Google-inloggning. Vi anropar bara rätt funktion.
 * ════════════════════════════════════════════════════════════════
 */

// Generiskt felmeddelande: avslöja aldrig om ett konto finns eller inte.
const LOGIN_FAILED = "Wrong email or password, or the email isn't verified yet.";

export async function signIn(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const email = formText(form, "email");
  const password = formText(form, "password");
  if (!email || !password) return { ok: false, error: "Fill in email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: LOGIN_FAILED };

  redirect(safeNextPath(formText(form, "next")));
}

export async function signUp(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const email = formText(form, "email");
  const password = formText(form, "password");
  const name = formText(form, "name");
  const next = safeNextPath(formText(form, "next"));

  if (!email || !password) return { ok: false, error: "Fill in email and password." };
  if (password.length < 8) return { ok: false, error: "The password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      // Länken i verifieringsmejlet leder hit → tillbaka till det man ville göra
      emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  });

  if (error) return { ok: false, error: "Could not create the account. Check your details and try again." };

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signInWithGoogle(form: FormData): Promise<void> {
  const next = safeNextPath(formText(form, "next"));
  const supabase = await createClient();

  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(next)}`) },
  });

  if (data.url) redirect(data.url);
  redirect("/login?error=oauth");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const email = formText(form, "email");
  if (!email) return { ok: false, error: "Enter your email." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl("/auth/callback?next=/reset-password"),
  });

  // Samma svar oavsett om kontot finns – så ingen kan "fiska" efter konton.
  return { ok: true };
}

export async function updatePassword(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const password = formText(form, "password");
  if (!password || password.length < 8) return { ok: false, error: "At least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: "The reset link has expired. Request a new one." };

  redirect("/dashboard");
}
