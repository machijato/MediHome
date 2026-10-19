-- Recenzije oglasa: učvršćenje nakon sigurnosnog savjetnika (primijenjeno kao listing_reviews_hardening).

alter function public.touch_updated_at() set search_path = public;
alter function public.listing_reviews_before_update() set search_path = public;

-- Pomoćne funkcije za pravila pristupa trebaju samo prijavljenim korisnicima.
revoke all on function public.is_admin() from public, anon;
revoke all on function public.owns_review_listing(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_review_listing(uuid) to authenticated;
