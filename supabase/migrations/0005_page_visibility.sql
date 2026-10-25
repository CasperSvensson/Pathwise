-- ════════════════════════════════════════════════════════════════
--  0005 – SYNLIGHET PER SIDA (ögat i sidmenyn)
--
--  visible = om sidan SKA vara publik. Ändringen gäller först när
--  någon trycker Publish (då publiceras/avpubliceras sidorna).
--  Om sidan ÄR publik just nu syns på published_version_id.
-- ════════════════════════════════════════════════════════════════

alter table public.canvases
  add column visible boolean not null default false;

-- Sidor som redan är publicerade ska förbli synliga
update public.canvases set visible = true where published_version_id is not null;

-- Redigerare får ändra synligheten (men fortfarande inte publicera direkt)
grant update (slug, title, description, visible) on public.canvases to authenticated;
