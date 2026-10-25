import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * ⚠️  ADMIN-KLIENT – kringgår ALLA säkerhetsregler (RLS).
 *
 * Får bara användas på servern, och bara EFTER att vi själva har
 * kontrollerat behörighet och plan. Används för:
 *   - Stripe-webhooken (skriver prenumerationer)
 *   - publicering / avpublicering (efter plankontroll)
 *
 * "server-only" ovan gör att bygget kraschar om filen råkar
 * importeras i webbläsarkod – så nyckeln kan aldrig läcka.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
