-- Recenzije oglasa, dio 2/4: okidači za statistike i označavanje izmjena moderatora.

-- ---------------------------------------------------------------------------
-- Okidači
-- ---------------------------------------------------------------------------

create trigger review_replies_touch before update on public.review_replies
  for each row execute function public.touch_updated_at();

-- Ažurira vrijeme izmjene; ako recenziju mijenja netko drugi osim autora (moderator), označava izmjenu.
create or replace function public.listing_reviews_before_update() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.comment is distinct from old.comment and auth.uid() is distinct from old.reviewer_user_id then
    new.edited_by_moderator := true;
  end if;
  return new;
end;
$$;

create trigger listing_reviews_before_update before update on public.listing_reviews
  for each row execute function public.listing_reviews_before_update();

create or replace function public.refresh_review_stats(p_listing_id uuid, p_provider_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.provider_listings where id = p_listing_id) then
    insert into public.listing_rating_stats (listing_id, review_count, avg_rating, updated_at)
    select p_listing_id, count(*), round(avg(rating), 1), now()
    from public.listing_reviews
    where listing_id = p_listing_id and status = 'published'
    on conflict (listing_id) do update
      set review_count = excluded.review_count, avg_rating = excluded.avg_rating, updated_at = excluded.updated_at;
  end if;

  if exists (select 1 from public.provider_profiles where id = p_provider_id) then
    insert into public.provider_rating_stats (provider_profile_id, review_count, avg_rating, updated_at)
    select p_provider_id, count(*), round(avg(rating), 1), now()
    from public.listing_reviews
    where provider_profile_id = p_provider_id and status = 'published'
    on conflict (provider_profile_id) do update
      set review_count = excluded.review_count, avg_rating = excluded.avg_rating, updated_at = excluded.updated_at;
  end if;
end;
$$;

create or replace function public.listing_reviews_refresh_stats() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_review_stats(old.listing_id, old.provider_profile_id);
    return old;
  end if;
  perform public.refresh_review_stats(new.listing_id, new.provider_profile_id);
  return new;
end;
$$;

create trigger listing_reviews_refresh_stats after insert or update or delete on public.listing_reviews
  for each row execute function public.listing_reviews_refresh_stats();

revoke all on function public.refresh_review_stats(uuid, uuid) from public, anon, authenticated;
revoke all on function public.listing_reviews_refresh_stats() from public, anon, authenticated;
