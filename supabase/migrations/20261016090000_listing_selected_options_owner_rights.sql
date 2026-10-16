-- Vlasnik oglasa može upisivati, vidjeti i brisati odabrane opcije svog oglasa (svih statusa).
-- Bez ovoga nijedan oglas stvoren kroz aplikaciju nije imao spremljene opcije (RLS je tiho blokirao upis).

create policy "Provider can read own selected options" on public.listing_selected_options for select to authenticated
using (listing_id in (select pl.id from public.provider_listings pl join public.provider_profiles pp on pp.id = pl.provider_profile_id where pp.user_id = auth.uid()));

create policy "Provider can insert own selected options" on public.listing_selected_options for insert to authenticated
with check (listing_id in (select pl.id from public.provider_listings pl join public.provider_profiles pp on pp.id = pl.provider_profile_id where pp.user_id = auth.uid()));

create policy "Provider can delete own selected options" on public.listing_selected_options for delete to authenticated
using (listing_id in (select pl.id from public.provider_listings pl join public.provider_profiles pp on pp.id = pl.provider_profile_id where pp.user_id = auth.uid()));
