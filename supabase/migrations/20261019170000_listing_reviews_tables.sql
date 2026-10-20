-- Recenzije oglasa, dio 1/4: tablice, pitanja upitnika, pomoćne funkcije (RLS uključen, pravila u dijelu 4).
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

-- RLS uključen odmah (bez pravila = nitko nema pristup dok se ne dodaju pravila u dijelu 4).
alter table public.listing_reviews enable row level security;
alter table public.listing_review_answers enable row level security;
alter table public.review_replies enable row level security;
alter table public.review_reports enable row level security;
alter table public.listing_rating_stats enable row level security;
alter table public.provider_rating_stats enable row level security;
