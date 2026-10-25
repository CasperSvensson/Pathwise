-- ════════════════════════════════════════════════════════════════
--  0001 – TABELLER
--  Kör filerna i ordning: 0001 → 0002 → 0003 → 0004
--  (Supabase Dashboard → SQL Editor → klistra in → Run)
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
--  PROFILES – en rad per inloggad användare
--  Skapas automatiskt när någon registrerar sig (se 0002).
-- ────────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  locale        text not null default 'en',
  created_at    timestamptz not null default now()
);


-- ────────────────────────────────────────────────────────────────
--  COMPANIES – företag / kreatör. Ett per konto (owner_id är unikt).
-- ────────────────────────────────────────────────────────────────
create table public.companies (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null unique references public.profiles (id) on delete cascade,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 2 and 80),
  tagline      text,
  description  text,
  vision       text,
  category     text,
  logo_url     text,
  cover_url    text,
  is_listed    boolean not null default true,   -- syns i Explore?
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Gamla slugs → nytt företag (så att delade länkar fortsätter fungera)
create table public.company_slug_redirects (
  old_slug    text primary key,
  company_id  uuid not null references public.companies (id) on delete cascade
);


-- ────────────────────────────────────────────────────────────────
--  COMPANY_MEMBERS – moderatorer/redigerare utöver ägaren
--  (Ägaren ligger i companies.owner_id och behöver ingen rad här.)
-- ────────────────────────────────────────────────────────────────
create table public.company_members (
  company_id  uuid not null references public.companies (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null check (role in ('editor', 'moderator')),
  created_at  timestamptz not null default now(),
  primary key (company_id, user_id)
);


-- ────────────────────────────────────────────────────────────────
--  CANVASES – en canvas-sida (egen URL: /c/{företag}/{canvas})
-- ────────────────────────────────────────────────────────────────
create table public.canvases (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies (id) on delete cascade,
  slug                  text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                 text not null,
  description           text,
  published_version_id  uuid,                    -- null = inte publicerad
  published_at          timestamptz,
  search_text           text not null default '', -- nodtext, uppdateras vid publicering
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (company_id, slug)
);

-- Utkastet ligger i en egen tabell så att besökare aldrig kan läsa det.
create table public.canvas_drafts (
  canvas_id   uuid primary key references public.canvases (id) on delete cascade,
  content     jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Varje publicering sparas som en version (versionshistorik).
create table public.canvas_versions (
  id          uuid primary key default gen_random_uuid(),
  canvas_id   uuid not null references public.canvases (id) on delete cascade,
  version_no  int  not null,
  content     jsonb not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (canvas_id, version_no)
);

alter table public.canvases
  add constraint canvases_published_version_fk
  foreign key (published_version_id) references public.canvas_versions (id) on delete set null;


-- ────────────────────────────────────────────────────────────────
--  WIDGET_RESPONSES – svar på omröstningar, betyg, feedback osv.
--  En rad per användare och widget (man kan ändra sitt svar).
-- ────────────────────────────────────────────────────────────────
create table public.widget_responses (
  id          uuid primary key default gen_random_uuid(),
  canvas_id   uuid not null references public.canvases (id) on delete cascade,
  node_id     text not null,
  widget_id   text not null,
  user_id     uuid references public.profiles (id) on delete set null, -- null = anonymiserad
  value       jsonb not null,   -- t.ex. {"choice":"yes"} eller {"text":"..."}
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (canvas_id, widget_id, user_id)
);

create index widget_responses_canvas_idx on public.widget_responses (canvas_id, widget_id);


-- ────────────────────────────────────────────────────────────────
--  FOLLOWS & BLOCKS
-- ────────────────────────────────────────────────────────────────
create table public.follows (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  company_id  uuid not null references public.companies (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, company_id)
);

create table public.blocked_users (
  company_id  uuid not null references public.companies (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (company_id, user_id)
);


-- ────────────────────────────────────────────────────────────────
--  SUBSCRIPTIONS – speglar Stripe. Skrivs ENDAST av webhooken
--  (service role). Användaren kan bara läsa sin egen rad.
-- ────────────────────────────────────────────────────────────────
create table public.subscriptions (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  plan                    text not null default 'free' check (plan in ('free', 'premium', 'enterprise')),
  status                  text not null default 'inactive', -- Stripe-status: trialing, active, past_due, canceled ...
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  trial_used              boolean not null default false,
  updated_at              timestamptz not null default now()
);
