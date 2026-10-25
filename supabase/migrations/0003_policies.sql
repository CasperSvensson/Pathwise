-- ════════════════════════════════════════════════════════════════
--  0003 – SÄKERHETSREGLER (Row Level Security)
--
--  RLS betyder: databasen själv kontrollerar vem som får läsa och
--  skriva varje rad. Även om någon kringgår vårt gränssnitt och
--  pratar direkt med Supabase gäller reglerna nedan.
--
--  Vissa saker (publicera, abonnemang, moderatorer) får ENDAST
--  göras av servern med service role-nyckeln, efter att servern
--  kontrollerat plan och behörighet. Därför saknar de skrivregler.
-- ════════════════════════════════════════════════════════════════

alter table public.profiles                enable row level security;
alter table public.companies               enable row level security;
alter table public.company_slug_redirects  enable row level security;
alter table public.company_members         enable row level security;
alter table public.canvases                enable row level security;
alter table public.canvas_drafts           enable row level security;
alter table public.canvas_versions         enable row level security;
alter table public.widget_responses        enable row level security;
alter table public.follows                 enable row level security;
alter table public.blocked_users           enable row level security;
alter table public.subscriptions           enable row level security;


-- ── PROFILES ────────────────────────────────────────────────────
create policy "Profiler är publika"
  on public.profiles for select using (true);

create policy "Man uppdaterar sin egen profil"
  on public.profiles for update using (id = auth.uid());


-- ── COMPANIES ───────────────────────────────────────────────────
create policy "Företagsprofiler är publika (utom för blockerade)"
  on public.companies for select using (not public.is_blocked(id) or public.is_company_staff(id));

create policy "Man skapar sitt eget företag"
  on public.companies for insert with check (owner_id = auth.uid());

create policy "Ägaren uppdaterar företaget"
  on public.companies for update using (public.is_company_owner(id));

create policy "Ägaren tar bort företaget"
  on public.companies for delete using (public.is_company_owner(id));


-- ── SLUG-OMDIRIGERINGAR ─────────────────────────────────────────
create policy "Omdirigeringar är publika"
  on public.company_slug_redirects for select using (true);

create policy "Ägaren skapar omdirigeringar"
  on public.company_slug_redirects for insert with check (public.is_company_owner(company_id));


-- ── COMPANY_MEMBERS (skrivs bara av servern) ────────────────────
create policy "Personal ser teamet"
  on public.company_members for select using (public.is_company_staff(company_id));


-- ── CANVASES ────────────────────────────────────────────────────
create policy "Publicerade canvas syns för alla, utkast för personal"
  on public.canvases for select using (public.can_view_canvas(id));

create policy "Redigerare skapar canvas"
  on public.canvases for insert
  with check (public.is_company_editor(company_id) and published_version_id is null);

create policy "Redigerare uppdaterar canvas"
  on public.canvases for update using (public.is_company_editor(company_id));

create policy "Redigerare tar bort canvas"
  on public.canvases for delete using (public.is_company_editor(company_id));

-- Publiceringskolumnerna får INTE ändras direkt av användare.
-- Bara servern (service role) publicerar, efter plankontroll.
revoke update on public.canvases from anon, authenticated;
grant  update (slug, title, description) on public.canvases to authenticated;


-- ── CANVAS_DRAFTS (bara personal) ───────────────────────────────
create policy "Redigerare läser utkast"
  on public.canvas_drafts for select
  using (public.is_company_editor((select company_id from public.canvases where id = canvas_id)));

create policy "Redigerare skapar utkast"
  on public.canvas_drafts for insert
  with check (public.is_company_editor((select company_id from public.canvases where id = canvas_id)));

create policy "Redigerare sparar utkast"
  on public.canvas_drafts for update
  using (public.is_company_editor((select company_id from public.canvases where id = canvas_id)));


-- ── CANVAS_VERSIONS (skrivs bara av servern) ────────────────────
create policy "Publicerad version syns för alla, historik för redigerare"
  on public.canvas_versions for select
  using (
    exists (
      select 1 from public.canvases c
      where c.id = canvas_id
        and (
          (c.published_version_id = canvas_versions.id and not public.is_blocked(c.company_id))
          or public.is_company_editor(c.company_id)
        )
    )
  );


-- ── WIDGET_RESPONSES ────────────────────────────────────────────
create policy "Man ser sina egna svar, personal ser alla"
  on public.widget_responses for select
  using (
    user_id = auth.uid()
    or public.is_company_staff((select company_id from public.canvases where id = canvas_id))
  );

create policy "Inloggade svarar på publicerade canvas"
  on public.widget_responses for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.canvases c
      where c.id = canvas_id
        and c.published_version_id is not null
        and not public.is_blocked(c.company_id)
    )
  );

create policy "Man ändrar sitt eget svar"
  on public.widget_responses for update using (user_id = auth.uid());

create policy "Man tar bort sitt svar, personal modererar"
  on public.widget_responses for delete
  using (
    user_id = auth.uid()
    or public.is_company_staff((select company_id from public.canvases where id = canvas_id))
  );


-- ── FOLLOWS ─────────────────────────────────────────────────────
create policy "Man ser sina följningar, personal ser sina följare"
  on public.follows for select
  using (user_id = auth.uid() or public.is_company_staff(company_id));

create policy "Man följer själv"
  on public.follows for insert
  with check (user_id = auth.uid() and not public.is_blocked(company_id));

create policy "Man slutar följa själv"
  on public.follows for delete using (user_id = auth.uid());


-- ── BLOCKED_USERS ───────────────────────────────────────────────
create policy "Personal ser blockeringar"
  on public.blocked_users for select using (public.is_company_staff(company_id));

create policy "Personal blockerar"
  on public.blocked_users for insert with check (public.is_company_staff(company_id));

create policy "Personal avblockerar"
  on public.blocked_users for delete using (public.is_company_staff(company_id));


-- ── SUBSCRIPTIONS (skrivs bara av Stripe-webhooken) ─────────────
create policy "Man ser sin egen prenumeration"
  on public.subscriptions for select using (user_id = auth.uid());
