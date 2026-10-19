-- Recenzije oglasa: upitnici po kategoriji, recenzije, odgovori pružatelja, prijave i statistike.
-- Pisanje recenzije ide isključivo kroz funkciju submit_listing_review (ocjenu računa baza, ne preglednik).
-- Dizajn: claude/ocjenjivanje-dizajn.md u projektnim dokumentima.

-- ---------------------------------------------------------------------------
-- Pomoćne funkcije
-- ---------------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.provider_profiles p where p.user_id = auth.uid() and p.is_admin);
$$;

-- "Ime Prezime" -> "Ime P." (prva riječ + inicijal zadnje riječi); bez imena -> "Korisnik".
create or replace function public.format_reviewer_name(p_full_name text) returns text
language plpgsql immutable set search_path = public as $$
declare
  v_clean text := btrim(coalesce(p_full_name, ''));
  v_parts text[];
  v_first text;
begin
  if v_clean = '' then
    return 'Korisnik';
  end if;
  v_parts := regexp_split_to_array(v_clean, '\s+');
  v_first := left(v_parts[1], 30);
  v_first := upper(left(v_first, 1)) || substr(v_first, 2);
  if array_length(v_parts, 1) = 1 then
    return v_first;
  end if;
  return v_first || ' ' || upper(left(v_parts[array_length(v_parts, 1)], 1)) || '.';
end;
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pitanja upitnika (po kategoriji; category_id null = zadani upitnik)
-- ---------------------------------------------------------------------------

create table public.review_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete cascade,
  sort_order smallint not null check (sort_order between 1 and 5),
  question_text text not null check (char_length(question_text) between 3 and 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index review_questions_category_order_key
  on public.review_questions (coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid), sort_order);

alter table public.review_questions enable row level security;

create policy "Anyone can read review questions" on public.review_questions
  for select to anon, authenticated using (true);

create policy "Admin can manage review questions" on public.review_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pitanja za oglas: pitanja njegove kategorije, a ako ih nema, zadani upitnik.
create or replace function public.review_questions_for_listing(p_listing_id uuid)
returns table (id uuid, sort_order smallint, question_text text)
language sql stable set search_path = public as $$
  with own as (
    select q.id, q.sort_order, q.question_text
    from public.review_questions q
    join public.provider_listings l on l.category_id = q.category_id
    where l.id = p_listing_id and q.is_active
  ),
  def as (
    select q.id, q.sort_order, q.question_text
    from public.review_questions q
    where q.category_id is null and q.is_active
  )
  select * from own
  union all
  select * from def where not exists (select 1 from own)
  order by 2;
$$;

insert into public.review_questions (category_id, sort_order, question_text)
select c.id, q.n, q.txt
from public.service_categories c
join (values
  ('fizioterapeut', 1, 'Kvaliteta usluge i stručnost'),
  ('fizioterapeut', 2, 'Pristup (uljudnost, strpljenje)'),
  ('fizioterapeut', 3, 'Točnost i dostupnost termina'),
  ('fizioterapeut', 4, 'Cijena kao oglašena'),
  ('kucna-njega', 1, 'Kvaliteta usluge i stručnost'),
  ('kucna-njega', 2, 'Poštovanje prema korisniku i obitelji'),
  ('kucna-njega', 3, 'Dolazak u dogovoreno vrijeme'),
  ('kucna-njega', 4, 'Cijena kao dogovorena'),
  ('najam-opreme', 1, 'Stanje i čistoća opreme'),
  ('najam-opreme', 2, 'Dostava i preuzimanje'),
  ('najam-opreme', 3, 'Upute za korištenje'),
  ('najam-opreme', 4, 'Cijena bez skrivenih troškova i povrat jamčevine'),
  ('sanitetski-prijevoz', 1, 'Točnost'),
  ('sanitetski-prijevoz', 2, 'Vozilo (čistoća, udobnost)'),
  ('sanitetski-prijevoz', 3, 'Osoblje i pomoć pri ulasku i izlasku'),
  ('sanitetski-prijevoz', 4, 'Sigurnost vožnje'),
  ('sanitetski-prijevoz', 5, 'Cijena kao dogovorena')
) as q(slug, n, txt) on q.slug = c.slug;

insert into public.review_questions (category_id, sort_order, question_text) values
  (null, 1, 'Kvaliteta usluge i stručnost'),
  (null, 2, 'Komunikacija i ljubaznost'),
  (null, 3, 'Cijena kao dogovorena');

-- ---------------------------------------------------------------------------
-- Recenzije i odgovori na pitanja
-- ---------------------------------------------------------------------------

create table public.listing_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.provider_listings(id) on delete cascade,
  provider_profile_id uuid not null references public.provider_profiles(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_name text not null,
  rating numeric(2,1) not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  used_service_month date not null check (extract(day from used_service_month) = 1),
  status text not null default 'published' check (status in ('published', 'hidden')),
  edited_by_moderator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, reviewer_user_id)
);

create index listing_reviews_listing_status_idx on public.listing_reviews (listing_id, status);
create index listing_reviews_provider_status_idx on public.listing_reviews (provider_profile_id, status);
create index listing_reviews_reviewer_idx on public.listing_reviews (reviewer_user_id);

-- Je li prijavljeni korisnik vlasnik oglasa na koji se odnosi recenzija.
create or replace function public.owns_review_listing(p_review_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.listing_reviews r
    join public.provider_listings l on l.id = r.listing_id
    join public.provider_profiles p on p.id = l.provider_profile_id
    where r.id = p_review_id and p.user_id = auth.uid()
  );
$$;

create table public.listing_review_answers (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.listing_reviews(id) on delete cascade,
  question_id uuid references public.review_questions(id) on delete set null,
  question_text text not null,
  score smallint not null check (score between 1 and 5),
  unique (review_id, question_id)
);

create index listing_review_answers_review_idx on public.listing_review_answers (review_id);

-- Odgovor pružatelja (najviše jedan po recenziji).
create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.listing_reviews(id) on delete cascade,
  author_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reply_text text not null check (char_length(btrim(reply_text)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prijave recenzija (vlasnik oglasa ili bilo koji prijavljeni korisnik).
create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.listing_reviews(id) on delete cascade,
  reporter_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null check (reason in ('nije_koristio_uslugu', 'lazna_recenzija', 'neprimjeren_sadrzaj', 'osobni_podaci', 'ostalo')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected')),
  admin_note text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_user_id)
);

create index review_reports_status_idx on public.review_reports (status, created_at);

-- Statistike (pišu ih samo okidači).
create table public.listing_rating_stats (
  listing_id uuid primary key references public.provider_listings(id) on delete cascade,
  review_count integer not null default 0,
  avg_rating numeric(2,1),
  updated_at timestamptz not null default now()
);

create table public.provider_rating_stats (
  provider_profile_id uuid primary key references public.provider_profiles(id) on delete cascade,
  review_count integer not null default 0,
  avg_rating numeric(2,1),
  updated_at timestamptz not null default now()
);

-- Prosjek po pitanju za oglas (samo objavljene recenzije; poštuje pravila pristupa pozivatelja).
create view public.listing_question_stats with (security_invoker = true) as
select
  r.listing_id,
  a.question_id,
  max(a.question_text) as question_text,
  round(avg(a.score)::numeric, 1) as avg_score,
  count(*)::int as answer_count
from public.listing_review_answers a
join public.listing_reviews r on r.id = a.review_id
where r.status = 'published'
group by r.listing_id, a.question_id;

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

-- ---------------------------------------------------------------------------
-- Pisanje recenzije (jedini put za unos/izmjenu recenzije)
-- p_answers: [{"question_id": "...", "score": 1-5}, ...] za SVA pitanja upitnika oglasa.
-- ---------------------------------------------------------------------------

create or replace function public.submit_listing_review(
  p_listing_id uuid,
  p_answers jsonb,
  p_comment text,
  p_used_month date,
  p_confirmed boolean
) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid := auth.uid();
  v_listing record;
  v_full_name text;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
  v_month date;
  v_question_count int;
  v_rating numeric(2,1);
  v_review_id uuid;
begin
  if v_uid is null then
    raise exception 'Za ocjenjivanje se morate prijaviti.';
  end if;
  if p_confirmed is not true then
    raise exception 'Potvrdite da ste koristili ovu uslugu.';
  end if;

  select l.id, l.status, l.provider_profile_id, pp.user_id as owner_user_id
    into v_listing
  from public.provider_listings l
  join public.provider_profiles pp on pp.id = l.provider_profile_id
  where l.id = p_listing_id;

  if not found or v_listing.status <> 'approved' then
    raise exception 'Oglas nije pronađen.';
  end if;
  if v_listing.owner_user_id = v_uid then
    raise exception 'Ne možete ocijeniti vlastiti oglas.';
  end if;

  if v_comment is not null and char_length(v_comment) > 1000 then
    raise exception 'Tekst recenzije može imati najviše 1000 znakova.';
  end if;

  if p_used_month is null then
    raise exception 'Odaberite mjesec i godinu korištenja usluge.';
  end if;
  v_month := date_trunc('month', p_used_month)::date;
  if v_month > date_trunc('month', current_date)::date
     or v_month < (date_trunc('month', current_date) - interval '5 years')::date then
    raise exception 'Mjesec korištenja usluge nije valjan.';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Odgovorite na sva pitanja ocjenom od 1 do 5.';
  end if;

  select count(*) into v_question_count from public.review_questions_for_listing(p_listing_id);

  if v_question_count = 0
     or (select count(*) from jsonb_to_recordset(p_answers) as x(question_id uuid, score int)) <> v_question_count
     or (select count(distinct x.question_id) from jsonb_to_recordset(p_answers) as x(question_id uuid, score int)) <> v_question_count
     or exists (
       select 1 from jsonb_to_recordset(p_answers) as x(question_id uuid, score int)
       where x.question_id is null or x.score is null or x.score not between 1 and 5
     )
     or exists (
       select 1 from jsonb_to_recordset(p_answers) as x(question_id uuid, score int)
       where x.question_id not in (select q.id from public.review_questions_for_listing(p_listing_id) q)
     ) then
    raise exception 'Odgovorite na sva pitanja ocjenom od 1 do 5.';
  end if;

  select round(avg(x.score)::numeric, 1)
    into v_rating
  from jsonb_to_recordset(p_answers) as x(question_id uuid, score int);

  select nullif(btrim(u.raw_user_meta_data ->> 'full_name'), '')
    into v_full_name
  from auth.users u
  where u.id = v_uid;

  insert into public.listing_reviews
    (listing_id, provider_profile_id, reviewer_user_id, reviewer_name, rating, comment, used_service_month)
  values
    (p_listing_id, v_listing.provider_profile_id, v_uid, public.format_reviewer_name(v_full_name), v_rating, v_comment, v_month)
  on conflict (listing_id, reviewer_user_id) do update
    set reviewer_name = excluded.reviewer_name,
        rating = excluded.rating,
        comment = excluded.comment,
        used_service_month = excluded.used_service_month,
        edited_by_moderator = false
  returning id into v_review_id;

  delete from public.listing_review_answers where review_id = v_review_id;

  insert into public.listing_review_answers (review_id, question_id, question_text, score)
  select v_review_id, q.id, q.question_text, x.score
  from jsonb_to_recordset(p_answers) as x(question_id uuid, score int)
  join public.review_questions_for_listing(p_listing_id) q on q.id = x.question_id;

  return v_review_id;
end;
$$;

revoke all on function public.submit_listing_review(uuid, jsonb, text, date, boolean) from public, anon;
grant execute on function public.submit_listing_review(uuid, jsonb, text, date, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Pravila pristupa (RLS)
-- ---------------------------------------------------------------------------

alter table public.listing_reviews enable row level security;
alter table public.listing_review_answers enable row level security;
alter table public.review_replies enable row level security;
alter table public.review_reports enable row level security;
alter table public.listing_rating_stats enable row level security;
alter table public.provider_rating_stats enable row level security;

-- Recenzije: svi vide objavljene recenzije odobrenih oglasa; autor svoje; admin sve.
-- Unos i izmjena autora idu samo kroz submit_listing_review (nema INSERT pravila).
create policy "Public can read published reviews" on public.listing_reviews
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (select 1 from public.provider_listings l where l.id = listing_id and l.status = 'approved')
  );

create policy "Reviewer can read own reviews" on public.listing_reviews
  for select to authenticated using (reviewer_user_id = auth.uid());

create policy "Admin can read all reviews" on public.listing_reviews
  for select to authenticated using (public.is_admin());

create policy "Reviewer can delete own review" on public.listing_reviews
  for delete to authenticated using (reviewer_user_id = auth.uid());

create policy "Admin can update reviews" on public.listing_reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admin can delete reviews" on public.listing_reviews
  for delete to authenticated using (public.is_admin());

-- Odgovori na pitanja: vidljivi kao i recenzija kojoj pripadaju (ugrađeno pravilo pristupa recenziji).
create policy "Read answers of visible reviews" on public.listing_review_answers
  for select to anon, authenticated
  using (exists (select 1 from public.listing_reviews r where r.id = review_id));

-- Odgovori pružatelja.
create policy "Read replies of visible reviews" on public.review_replies
  for select to anon, authenticated
  using (exists (select 1 from public.listing_reviews r where r.id = review_id));

create policy "Listing owner can add reply" on public.review_replies
  for insert to authenticated
  with check (author_user_id = auth.uid() and public.owns_review_listing(review_id));

create policy "Listing owner can edit reply" on public.review_replies
  for update to authenticated
  using (author_user_id = auth.uid() and public.owns_review_listing(review_id))
  with check (author_user_id = auth.uid() and public.owns_review_listing(review_id));

create policy "Listing owner can delete reply" on public.review_replies
  for delete to authenticated
  using (author_user_id = auth.uid() and public.owns_review_listing(review_id));

create policy "Admin can manage replies" on public.review_replies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Prijave: prijavljuje bilo koji prijavljeni korisnik koji vidi recenziju; vidi ih prijavitelj i admin.
create policy "Users can report visible reviews" on public.review_reports
  for insert to authenticated
  with check (
    reporter_user_id = auth.uid()
    and status = 'open' and handled_by is null and handled_at is null and admin_note is null
    and exists (select 1 from public.listing_reviews r where r.id = review_id)
  );

create policy "Reporter or admin can read reports" on public.review_reports
  for select to authenticated using (reporter_user_id = auth.uid() or public.is_admin());

create policy "Admin can update reports" on public.review_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admin can delete reports" on public.review_reports
  for delete to authenticated using (public.is_admin());

-- Statistike: javno čitanje, pisanje samo kroz okidače.
create policy "Anyone can read listing rating stats" on public.listing_rating_stats
  for select to anon, authenticated using (true);

create policy "Anyone can read provider rating stats" on public.provider_rating_stats
  for select to anon, authenticated using (true);

-- Anonimni korisnici smiju samo čitati.
revoke insert, update, delete, truncate on
  public.review_questions, public.listing_reviews, public.listing_review_answers,
  public.review_replies, public.review_reports, public.listing_rating_stats,
  public.provider_rating_stats, public.listing_question_stats
from anon;

revoke all on public.review_reports from anon;
