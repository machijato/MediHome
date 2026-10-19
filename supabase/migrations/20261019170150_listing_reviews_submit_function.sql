-- Recenzije oglasa, dio 3/4: funkcija submit_listing_review (jedini put za pisanje recenzije).
-- NAPOMENA: ova se migracija NIJE primijenila automatski (poziv je otkazan); treba je pokrenuti ručno u Supabase SQL Editoru.

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

