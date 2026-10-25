/**
 * Typer för raderna i databasen (speglar supabase/migrations/0001_tables.sql).
 *
 * Tips: när projektet växer kan du generera dessa automatiskt med
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

import type { PlanId } from "@/lib/plans";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
};

export type Company = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  vision: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_listed: boolean;
};

export type Canvas = {
  id: string;
  company_id: string;
  slug: string;
  title: string;
  description: string | null;
  published_version_id: string | null;
  published_at: string | null;
  updated_at: string;
  /** Ska sidan vara publik? Gäller först efter nästa Publish. */
  visible: boolean;
};

/** En rad i sidmenyn (hamburgermenyn uppe till vänster). */
export type PageItem = {
  id: string;
  title: string;
  slug: string;
  /** Ska vara publik efter nästa Publish (ögat). */
  visible: boolean;
  /** Är publik just nu. */
  isPublic: boolean;
};

export type CanvasVersion = {
  id: string;
  canvas_id: string;
  version_no: number;
  created_at: string;
};

export type Subscription = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanId;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_used: boolean;
};

/** En rad från search_companies() – används på Explore. */
export type ExploreCompany = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  follower_count: number;
  canvas_count: number;
  last_published: string | null;
};

/** Standardsvar från server actions: antingen ok eller ett felmeddelande. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: "login_required" | "upgrade_required" | "forbidden" };

/** Startläge för useActionState – "inget har skickats än". */
export const IDLE: ActionResult = { ok: true };
