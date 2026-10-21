-- Blokirani korisnik ne smije ni izravno (kroz Storage API) učitavati ni brisati slike oglasa.
-- Izričito odobrio vlasnik projekta (21.10.2026): "blokiran za sve radnje". Mijenja samo dva postojeća pravila
-- (ALTER POLICY): dodaje uvjet da korisnik nije blokiran (admin je izuzet).

alter policy "Owner or admin can delete listing images" on storage.objects
using (
  bucket_id = 'listing-images'
  and (
    exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin)
    or (
      not public.is_current_user_banned()
      and exists (
        select 1 from public.provider_listings pl
        join public.provider_profiles pp on pp.id = pl.provider_profile_id
        where pp.user_id = auth.uid() and pl.id::text = (storage.foldername(name))[1]
      )
    )
  )
);

alter policy "Authenticated users can upload listing images 1i0okip_0" on storage.objects
with check (
  bucket_id = 'listing-images'
  and (public.is_admin() or not public.is_current_user_banned())
);
