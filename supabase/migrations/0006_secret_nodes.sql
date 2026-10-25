-- ════════════════════════════════════════════════════════════════
--  0006 – HEMLIGA NODER ("Top secret")
--
--  En publicerad version sparas nu i två varianter:
--    content          → det besökare får läsa. Hemliga noder är tömda.
--    private_content  → hela utkastet, med hemligheterna. Bara servern
--                       (admin-klienten, efter behörighetskontroll) läser den.
--
--  Utan det här skulle vem som helst kunna läsa hemligheterna direkt
--  via Supabase-API:t, även om sidan bara visar en mapp.
-- ════════════════════════════════════════════════════════════════

alter table public.canvas_versions
  add column private_content jsonb;

-- Vanliga användare (inloggade och anonyma) får läsa alla kolumner UTOM private_content.
revoke select on public.canvas_versions from anon, authenticated;
grant select (id, canvas_id, version_no, content, created_by, created_at)
  on public.canvas_versions to anon, authenticated;
