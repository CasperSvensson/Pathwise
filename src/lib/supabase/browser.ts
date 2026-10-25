import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-klient för kod som körs i webbläsaren ("use client"-komponenter).
 * Används t.ex. för bilduppladdning direkt till Storage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
