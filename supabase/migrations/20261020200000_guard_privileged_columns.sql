-- Zaštita privilegiranih polja: obični korisnik ne smije sam sebi postaviti administratora,
-- status/javnost profila ni odobriti vlastiti oglas. RLS pravila provjeravaju samo vlasništvo retka,
-- a authenticated ima pravo upisa u sve stupce, pa se ograničenje provodi okidačem.
-- Administratori i interni pozivi (bez auth.uid(): SQL editor, migracije, service role) nisu ograničeni.

create or replace function public.provider_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Novi profil koji korisnik sam stvara dobiva uvijek sigurne zadane vrijednosti.
    new.is_admin := false;
    new.status := 'active';
    new.is_public := true;
    new.approved_at := null;
    new.priority_score := 0;
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.is_admin is distinct from old.is_admin
     or new.status is distinct from old.status
     or new.is_public is distinct from old.is_public
     or new.approved_at is distinct from old.approved_at
     or new.priority_score is distinct from old.priority_score then
    raise exception 'Izmjena zaštićenih polja profila nije dopuštena.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger provider_profiles_guard_trg
  before insert or update on public.provider_profiles
  for each row execute function public.provider_profiles_guard();

create or replace function public.provider_listings_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Novi oglas uvijek čeka odobrenje administratora.
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

create trigger provider_listings_guard_trg
  before insert or update on public.provider_listings
  for each row execute function public.provider_listings_guard();

revoke execute on function public.provider_profiles_guard() from public, anon, authenticated;
revoke execute on function public.provider_listings_guard() from public, anon, authenticated;
