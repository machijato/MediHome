-- Javno vidljivi su samo odobreni oglasi
alter policy "Allow public read" on public.provider_listings using (status = 'approved');

-- Pružatelj vidi svoje oglase svih statusa (dashboard)
create policy "Provider can read own listings" on public.provider_listings for select to authenticated
using (provider_profile_id in (select id from public.provider_profiles where user_id = auth.uid()));

-- Pružatelj briše slike svojih oglasa
create policy "Provider can delete own listing images" on public.listing_images for delete to authenticated
using (listing_id in (select pl.id from public.provider_listings pl join public.provider_profiles pp on pp.id = pl.provider_profile_id where pp.user_id = auth.uid()));

-- Admin briše slike i opcije oglasa
create policy "Admin can delete listing images" on public.listing_images for delete to authenticated
using (exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin));
create policy "Admin can delete selected options" on public.listing_selected_options for delete to authenticated
using (exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin));
