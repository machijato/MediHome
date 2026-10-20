-- 1) Administrator mora moći vidjeti i mijenjati sve profile (blokiranje/odblokiranje korisnika u admin panelu).
--    Dosad je vidio samo svoj i javne profile, a UPDATE tuđeg profila nije mijenjao nijedan redak.
--    Zaštićena polja običnim korisnicima i dalje čuvaju okidači iz 20261020200000_guard_privileged_columns.sql.
create policy "Admin can read all provider profiles"
  on public.provider_profiles for select to authenticated
  using (public.is_admin());

create policy "Admin can update all provider profiles"
  on public.provider_profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2) Slike uz oglas smije dodati samo vlasnik oglasa ili administrator (prije: bilo tko prijavljen, with check (true)).
drop policy "Authenticated users can insert listing images" on public.listing_images;

create policy "Provider or admin can insert listing images"
  on public.listing_images for insert to authenticated
  with check (
    public.is_admin()
    or listing_id in (
      select pl.id
      from public.provider_listings pl
      join public.provider_profiles pp on pp.id = pl.provider_profile_id
      where pp.user_id = auth.uid()
    )
  );
