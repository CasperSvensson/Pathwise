-- ════════════════════════════════════════════════════════════════
--  0004 – FILLAGRING (bilder för logotyper, omslag och noder)
--
--  Filer sparas som:  media/{company_id}/{filnamn}
--  Alla kan se bilderna, men bara företagets redigerare kan ladda upp.
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5 * 1024 * 1024,  -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
);

create policy "Media är publik"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Redigerare laddar upp till sitt företags mapp"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and public.is_company_editor(((storage.foldername(name))[1])::uuid)
  );

create policy "Redigerare tar bort sitt företags filer"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and public.is_company_editor(((storage.foldername(name))[1])::uuid)
  );
