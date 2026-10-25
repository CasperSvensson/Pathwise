-- ════════════════════════════════════════════════════════════════
--  0002 – FUNKTIONER OCH TRIGGERS
--  Hjälpfunktionerna används av säkerhetsreglerna (RLS) i 0003.
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
--  Skapa profil + tom prenumerationsrad när någon registrerar sig
-- ────────────────────────────────────────────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────────────────────
--  Uppdatera updated_at automatiskt (återanvänds av flera tabeller)
-- ────────────────────────────────────────────────────────────────
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_touch        before update on public.companies        for each row execute function public.touch_updated_at();
create trigger canvases_touch         before update on public.canvases         for each row execute function public.touch_updated_at();
create trigger canvas_drafts_touch    before update on public.canvas_drafts    for each row execute function public.touch_updated_at();
create trigger widget_responses_touch before update on public.widget_responses for each row execute function public.touch_updated_at();


-- ────────────────────────────────────────────────────────────────
--  BEHÖRIGHETSHJÄLPARE
--  "security definer" = körs med tabellägarens rättigheter, så att
--  RLS-reglerna kan anropa dem utan att fastna i sig själva.
-- ────────────────────────────────────────────────────────────────

-- Är inloggad användare ägare av företaget?
create function public.is_company_owner(target_company uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from companies
    where id = target_company and owner_id = auth.uid()
  );
$$;

-- Får inloggad användare redigera företagets canvas? (ägare eller editor)
create function public.is_company_editor(target_company uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_company_owner(target_company)
      or exists (
        select 1 from company_members
        where company_id = target_company
          and user_id = auth.uid()
          and role = 'editor'
      );
$$;

-- Får inloggad användare moderera? (ägare, editor eller moderator)
create function public.is_company_staff(target_company uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_company_owner(target_company)
      or exists (
        select 1 from company_members
        where company_id = target_company and user_id = auth.uid()
      );
$$;

-- Är inloggad användare blockerad från företaget?
create function public.is_blocked(target_company uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from blocked_users
    where company_id = target_company and user_id = auth.uid()
  );
$$;

-- Är canvasen publicerad och synlig för inloggad användare?
create function public.can_view_canvas(target_canvas uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from canvases c
    where c.id = target_canvas
      and (
        (c.published_version_id is not null and not public.is_blocked(c.company_id))
        or public.is_company_staff(c.company_id)
      )
  );
$$;


-- ────────────────────────────────────────────────────────────────
--  WIDGET-RESULTAT (aggregerade siffror, inga användar-ID:n)
--  Används både av besökare (om widgeten visar resultat) och av
--  ägare i Results-fliken.
-- ────────────────────────────────────────────────────────────────
create function public.get_widget_counts(target_canvas uuid)
returns table (widget_id text, choice text, total bigint)
language sql stable security definer set search_path = public
as $$
  select r.widget_id, r.value ->> 'choice' as choice, count(*) as total
  from widget_responses r
  where r.canvas_id = target_canvas
    and r.value ? 'choice'
    and public.can_view_canvas(target_canvas)
  group by r.widget_id, r.value ->> 'choice';
$$;


-- Antal följare (follows-tabellen är annars privat)
create function public.get_follower_count(target_company uuid)
returns bigint
language sql stable security definer set search_path = public
as $$
  select count(*) from follows where company_id = target_company;
$$;


-- ────────────────────────────────────────────────────────────────
--  EXPLORE-SÖK
--  Söker i företagsnamn, beskrivning, kategori, ägarnamn och nodtext.
--  sort: 'popular' | 'recent' | 'active'
-- ────────────────────────────────────────────────────────────────
create function public.search_companies(
  search_query     text default '',
  filter_category  text default null,
  sort_by          text default 'popular'
)
returns table (
  id               uuid,
  slug             text,
  name             text,
  tagline          text,
  category         text,
  logo_url         text,
  cover_url        text,
  follower_count   bigint,
  canvas_count     bigint,
  last_published   timestamptz,
  recent_activity  bigint
)
language sql stable security definer set search_path = public
as $$
  with published as (
    select company_id,
           count(*)              as canvas_count,
           max(published_at)     as last_published,
           string_agg(search_text, ' ') as all_text
    from canvases
    where published_version_id is not null
    group by company_id
  )
  select
    co.id, co.slug, co.name, co.tagline, co.category, co.logo_url, co.cover_url,
    (select count(*) from follows f where f.company_id = co.id)                         as follower_count,
    p.canvas_count,
    p.last_published,
    (select count(*) from widget_responses r
       join canvases c on c.id = r.canvas_id
      where c.company_id = co.id and r.created_at > now() - interval '30 days')         as recent_activity
  from companies co
  join published p on p.company_id = co.id
  join profiles  o on o.id = co.owner_id
  where co.is_listed
    and (filter_category is null or co.category = filter_category)
    and (
      coalesce(search_query, '') = ''
      or co.name         ilike '%' || search_query || '%'
      or co.tagline      ilike '%' || search_query || '%'
      or co.description  ilike '%' || search_query || '%'
      or co.category     ilike '%' || search_query || '%'
      or o.display_name  ilike '%' || search_query || '%'
      or p.all_text      ilike '%' || search_query || '%'
    )
  order by
    case when sort_by = 'recent' then extract(epoch from p.last_published) end desc nulls last,
    case when sort_by = 'active' then (select count(*) from widget_responses r
                                         join canvases c on c.id = r.canvas_id
                                        where c.company_id = co.id
                                          and r.created_at > now() - interval '30 days') end desc nulls last,
    (select count(*) from follows f where f.company_id = co.id) desc,
    co.name asc
  limit 60;
$$;
