-- Admin sučelje za reklame: administrator može čitati sve i dodavati/mijenjati/brisati slotove, kampanje i kreative.
-- Javno čitanje aktivnih kampanja ostaje kao prije. Izričito odobrio vlasnik projekta (21.10.2026): "admin sučelje za reklame".

create policy "Admin can read all ad slots" on public.ad_slots
  for select to authenticated using (public.is_admin());

create policy "Admin can read all ad campaigns" on public.ad_campaigns
  for select to authenticated using (public.is_admin());
create policy "Admin can insert ad campaigns" on public.ad_campaigns
  for insert to authenticated with check (public.is_admin());
create policy "Admin can update ad campaigns" on public.ad_campaigns
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin can delete ad campaigns" on public.ad_campaigns
  for delete to authenticated using (public.is_admin());

create policy "Admin can read all ad creatives" on public.ad_creatives
  for select to authenticated using (public.is_admin());
create policy "Admin can insert ad creatives" on public.ad_creatives
  for insert to authenticated with check (public.is_admin());
create policy "Admin can update ad creatives" on public.ad_creatives
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin can delete ad creatives" on public.ad_creatives
  for delete to authenticated using (public.is_admin());
