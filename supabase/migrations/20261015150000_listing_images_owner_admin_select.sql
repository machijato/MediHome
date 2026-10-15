-- Ispravak uz 20261015120000: DELETE traži i pravo čitanja (SELECT) nad retkom.
-- Bez ovoga vlasnik i admin ne vide (pa ni ne brišu) slike/opcije neodobrenih oglasa.

-- Vlasnik vidi slike svojih oglasa svih statusa
create policy "Provider can read own listing images" on public.listing_images for select to authenticated
using (listing_id in (select pl.id from public.provider_listings pl join public.provider_profiles pp on pp.id = pl.provider_profile_id where pp.user_id = auth.uid()));

-- Admin vidi slike svih oglasa
create policy "Admin can read all listing images" on public.listing_images for select to authenticated
using (exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin));

-- Admin vidi odabrane opcije svih oglasa (potrebno za njihovo brisanje)
create policy "Admin can read all selected options" on public.listing_selected_options for select to authenticated
using (exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin));
