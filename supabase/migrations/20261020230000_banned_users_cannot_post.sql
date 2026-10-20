-- Blokirani korisnik (provider_profiles.status = 'banned') ne može objaviti/uređivati oglase
-- ni ostavljati recenzije. Izričito odobrio vlasnik projekta (20.10.2026).
-- Ne dodaje tablice ni stupce; mijenja samo funkciju provider_listings_guard() i dodaje okidač na listing_reviews.

create or replace function public.is_current_user_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.provider_profiles p
    where p.user_id = auth.uid() and p.status = 'banned'
  );
$$;

create or replace function public.provider_listings_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if public.is_current_user_banned() then
    raise exception 'Vaš račun je blokiran. Za odblokiranje obratite se administratoru.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    return new;
  end if;

  if new.provider_profile_id is distinct from old.provider_profile_id then
    raise exception 'Oglas nije moguće prebaciti na drugi profil.' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and new.status not in ('draft', 'pending') then
    raise exception 'Status oglasa može promijeniti samo administrator.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.listing_reviews_banned_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.reviewer_user_id = auth.uid() and public.is_current_user_banned() then
    raise exception 'Vaš račun je blokiran. Za odblokiranje obratite se administratoru.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger listing_reviews_banned_guard_trg
  before insert or update on public.listing_reviews
  for each row execute function public.listing_reviews_banned_guard();
