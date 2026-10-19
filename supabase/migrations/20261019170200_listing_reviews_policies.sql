-- Recenzije oglasa, dio 4/4: pravila pristupa (RLS) i ograničenja za anonimne korisnike.

-- ---------------------------------------------------------------------------
-- Pravila pristupa (RLS)
-- ---------------------------------------------------------------------------

-- Pitanja upitnika: čitanje svima, upravljanje admin.
create policy "Anyone can read review questions" on public.review_questions
  for select to anon, authenticated using (true);

create policy "Admin can manage review questions" on public.review_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

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
