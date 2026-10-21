-- Blokirani korisnik (provider_profiles.status = 'banned') je blokiran za sve radnje pisanja
-- dok ga administrator ne odblokira. Izričito odobrio vlasnik projekta (21.10.2026).
-- Ne mijenja RLS politike niti dodaje tablice/stupce: dodaje samo opće okidače.
-- Admin i interni pozivi (auth.uid() je null) preskaču provjeru.

create or replace function public.block_banned_user_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return coalesce(new, old);
  end if;
  if public.is_current_user_banned() then
    raise exception 'Vaš račun je blokiran. Za odblokiranje obratite se administratoru.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger review_replies_banned_block_trg
  before insert or update or delete on public.review_replies
  for each row execute function public.block_banned_user_writes();

create trigger review_reports_banned_block_trg
  before insert or update or delete on public.review_reports
  for each row execute function public.block_banned_user_writes();

create trigger listing_images_banned_block_trg
  before insert or update or delete on public.listing_images
  for each row execute function public.block_banned_user_writes();

create trigger listing_selected_options_banned_block_trg
  before insert or update or delete on public.listing_selected_options
  for each row execute function public.block_banned_user_writes();

create trigger provider_profiles_banned_block_trg
  before insert or update or delete on public.provider_profiles
  for each row execute function public.block_banned_user_writes();

create trigger provider_listings_banned_delete_trg
  before delete on public.provider_listings
  for each row execute function public.block_banned_user_writes();

create trigger listing_reviews_banned_delete_trg
  before delete on public.listing_reviews
  for each row execute function public.block_banned_user_writes();
