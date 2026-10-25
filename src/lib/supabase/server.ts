import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-klient för serverkod (Server Components, Server Actions, Route Handlers).
 *
 * Den agerar som den INLOGGADE användaren – alla säkerhetsregler (RLS)
 * i databasen gäller. Använd den här i 99 % av fallen.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Anropad från en Server Component – där kan man inte sätta cookies.
            // Det är ok: proxy.ts förnyar sessionen på varje request.
          }
        },
      },
    },
  );
}
