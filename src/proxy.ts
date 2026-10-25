import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Next.js "proxy" (hette middleware.ts före Next 16).
 * Körs före varje sida – se lib/supabase/session.ts för logiken.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Kör inte på statiska filer, bilder eller Stripe-webhooken.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
