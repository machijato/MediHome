-- Vlasnik oglasa i admin mogu brisati datoteke slika iz bucketa listing-images.
-- Putanja datoteke je `${listing_id}/${naziv}`, pa se vlasništvo određuje prema prvoj mapi.
-- Napomena: vlasnik može brisati samo dok oglas postoji, zato aplikacija prvo briše datoteke, pa oglas.
create policy "Owner or admin can delete listing images" on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images'
  and (
    exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin)
    or exists (
      select 1 from public.provider_listings pl
      join public.provider_profiles pp on pp.id = pl.provider_profile_id
      where pp.user_id = auth.uid() and pl.id::text = (storage.foldername(name))[1]
    )
  )
);
