import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Stars,
  StarInput,
  UnverifiedNote,
  formatRating,
  formatMonth,
  formatDate,
  recentMonthOptions,
} from './Stars';
import { REVIEW_SELECT, Review, replyOf } from './types';
import { MyReport, OwnerActions } from './OwnerActions';

type Question = { id: string; sort_order: number; question_text: string };
type QuestionStat = { question_id: string; question_text: string; avg_score: number; answer_count: number };
type Stats = { review_count: number; avg_rating: number | null };

type ReviewsSectionProps = {
  listingId: string;
  providerProfileId?: string | null;
  user: any;
  onLoginClick: () => void;
};

const MAX_COMMENT = 1000;

export function ReviewsSection({ listingId, providerProfileId, user, onLoginClick }: ReviewsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stats, setStats] = useState<Stats>({ review_count: 0, avg_rating: null });
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [reports, setReports] = useState<Record<string, MyReport>>({});

  // Vlasnik oglasa na stranici oglasa može odgovoriti na recenziju i prijaviti je.
  useEffect(() => {
    let active = true;
    if (!user || !providerProfileId) {
      setIsOwner(false);
      return;
    }
    supabase
      .from('provider_profiles')
      .select('id')
      .eq('id', providerProfileId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsOwner(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [user, providerProfileId]);

  const load = useCallback(async () => {
    setLoadError(false);
    const [statsRes, qStatsRes, questionsRes, reviewsRes, reportsRes] = await Promise.all([
      supabase.from('listing_rating_stats').select('review_count, avg_rating').eq('listing_id', listingId).maybeSingle(),
      supabase.from('listing_question_stats').select('question_id, question_text, avg_score, answer_count').eq('listing_id', listingId),
      supabase.rpc('review_questions_for_listing', { p_listing_id: listingId }),
      supabase.from('listing_reviews').select(REVIEW_SELECT).eq('listing_id', listingId).order('created_at', { ascending: false }),
      user
        ? supabase.from('review_reports').select('review_id, status, reason').eq('reporter_user_id', user.id)
        : Promise.resolve({ data: [] as MyReport[], error: null }),
    ]);

    if (statsRes.error || qStatsRes.error || questionsRes.error || reviewsRes.error) {
      console.error('[reviews] load failed:', statsRes.error?.message ?? qStatsRes.error?.message ?? questionsRes.error?.message ?? reviewsRes.error?.message);
      setLoadError(true);
      setLoading(false);
      return;
    }

    setStats({
      review_count: statsRes.data?.review_count ?? 0,
      avg_rating: statsRes.data?.avg_rating != null ? Number(statsRes.data.avg_rating) : null,
    });
    setQuestionStats((qStatsRes.data ?? []).map((s: any) => ({ ...s, avg_score: Number(s.avg_score) })));
    setQuestions((questionsRes.data ?? []) as Question[]);
    setReviews(((reviewsRes.data ?? []) as unknown as Review[]).map((r) => ({ ...r, rating: Number(r.rating) })));
    setReports(Object.fromEntries(((reportsRes.data ?? []) as MyReport[]).map((r) => [r.review_id, r])));
    setLoading(false);
  }, [listingId, user]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Prijavljeni korisnik vidi i vlastitu skrivenu recenziju; ostali samo objavljene.
  const myReview = useMemo(
    () => (user ? reviews.find((r) => r.reviewer_user_id === user.id) ?? null : null),
    [reviews, user],
  );
  const publicReviews = reviews.filter((r) => r.status === 'published');

  return (
    <section data-testid="listing-reviews" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Recenzije</h2>
      <UnverifiedNote className="mb-5" />

      {loading ? (
        <p className="text-sm text-slate-500">Učitavanje recenzija...</p>
      ) : loadError ? (
        <p data-testid="reviews-load-error" className="text-sm text-red-600">Recenzije trenutno nije moguće učitati. Pokušajte ponovno kasnije.</p>
      ) : (
        <>
          {stats.review_count > 0 && stats.avg_rating != null ? (
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="flex items-center gap-3">
                <span data-testid="reviews-average" className="text-4xl font-bold text-slate-900">{formatRating(stats.avg_rating)}</span>
                <div>
                  <Stars value={stats.avg_rating} />
                  <p data-testid="reviews-count" className="text-sm text-slate-500 mt-0.5">
                    {stats.review_count} {reviewWord(stats.review_count)}
                  </p>
                </div>
              </div>
              {questionStats.length > 0 && (
                <ul className="flex-1 space-y-1.5" data-testid="reviews-question-stats">
                  {questionStats.map((s) => (
                    <li key={s.question_id} className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>{s.question_text}</span>
                      <span className="inline-flex items-center gap-2 shrink-0">
                        <Stars value={s.avg_score} size="sm" />
                        <span className="font-semibold text-slate-800 w-8 text-right">{formatRating(s.avg_score)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p data-testid="reviews-empty" className="text-sm text-slate-600 mb-6">Ovaj oglas još nema recenzija.</p>
          )}

          <div className="mb-6">
            {!user ? (
              <button
                type="button"
                data-testid="reviews-login-cta"
                onClick={onLoginClick}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Prijavite se da biste ostavili recenziju
              </button>
            ) : showForm ? (
              <ReviewForm
                listingId={listingId}
                questions={questions}
                existing={myReview}
                onCancel={() => setShowForm(false)}
                onSaved={async () => {
                  setShowForm(false);
                  await load();
                }}
              />
            ) : (
              <button
                type="button"
                data-testid="reviews-open-form"
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90"
              >
                {myReview ? 'Uredi svoju recenziju' : 'Ostavi recenziju'}
              </button>
            )}
            {myReview?.status === 'hidden' && !showForm && (
              <p data-testid="reviews-my-hidden" className="text-xs text-amber-700 mt-2">
                Vaša recenzija trenutno nije javno vidljiva (skrivena je zbog moderacije).
              </p>
            )}
          </div>

          {publicReviews.length > 0 && (
            <ul data-testid="reviews-list" className="space-y-5">
              {publicReviews.map((review) => (
                <ReviewItem key={review.id} review={review}>
                  {isOwner && <OwnerActions review={review} report={reports[review.id]} onChanged={load} />}
                </ReviewItem>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export function reviewWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'recenzije';
  return 'recenzija';
}

export function ReviewItem({ review, children }: { review: Review; children?: React.ReactNode; key?: React.Key }) {
  const reply = replyOf(review);
  return (
    <li data-testid="review-item" className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0"
        >
          {review.reviewer_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span data-testid="review-author" className="font-semibold text-slate-900">{review.reviewer_name}</span>
            <Stars value={review.rating} size="sm" />
            <span className="text-sm font-semibold text-slate-800">{formatRating(review.rating)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Korištenje usluge: {formatMonth(review.used_service_month)} · Objavljeno {formatDate(review.created_at)}
          </p>
          {review.comment && (
            <p data-testid="review-comment" className="text-slate-700 mt-2 whitespace-pre-wrap break-words">{review.comment}</p>
          )}
          {review.edited_by_moderator && (
            <p className="text-xs text-slate-500 mt-1 italic">Tekst je uredio moderator.</p>
          )}
          {review.listing_review_answers?.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {review.listing_review_answers.map((a) => (
                <li key={`${review.id}-${a.question_id ?? a.question_text}`}>
                  {a.question_text}: <span className="font-semibold text-slate-700">{a.score}/5</span>
                </li>
              ))}
            </ul>
          )}
          {reply && (
            <div data-testid="review-reply" className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-600 mb-1">Odgovor pružatelja · {formatDate(reply.created_at)}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{reply.reply_text}</p>
            </div>
          )}
          {children}
        </div>
      </div>
    </li>
  );
}

type ReviewFormProps = {
  listingId: string;
  questions: Question[];
  existing: Review | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
};

function ReviewForm({ listingId, questions, existing, onCancel, onSaved }: ReviewFormProps) {
  const months = useMemo(() => recentMonthOptions(36), []);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const a of existing?.listing_review_answers ?? []) {
      if (a.question_id) initial[a.question_id] = a.score;
    }
    return initial;
  });
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [month, setMonth] = useState(existing?.used_service_month ?? months[0].value);
  const [confirmed, setConfirmed] = useState(Boolean(existing));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allAnswered = questions.length > 0 && questions.every((q) => scores[q.id] >= 1);
  const previewRating = allAnswered
    ? Math.round((questions.reduce((sum, q) => sum + scores[q.id], 0) / questions.length) * 10) / 10
    : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!allAnswered) {
      setError('Odgovorite na sva pitanja ocjenom od 1 do 5.');
      return;
    }
    if (!confirmed) {
      setError('Potvrdite da ste koristili ovu uslugu.');
      return;
    }

    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc('submit_listing_review', {
      p_listing_id: listingId,
      p_answers: questions.map((q) => ({ question_id: q.id, score: scores[q.id] })),
      p_comment: comment.trim() === '' ? null : comment.trim(),
      p_used_month: month,
      p_confirmed: confirmed,
    });
    setSubmitting(false);

    if (rpcError) {
      // Poruke iz baze su na hrvatskom i namijenjene korisniku (npr. "Ne možete ocijeniti vlastiti oglas.").
      console.error('[reviews] submit failed:', rpcError.message);
      setError(rpcError.message || 'Recenziju nije moguće spremiti. Pokušajte ponovno.');
      return;
    }

    await onSaved();
  };

  return (
    <form data-testid="review-form" onSubmit={handleSubmit} className="border border-slate-200 rounded-2xl p-4 md:p-5 bg-slate-50 space-y-5">
      <h3 className="font-semibold text-slate-900">{existing ? 'Uredite svoju recenziju' : 'Ostavite recenziju'}</h3>

      <div className="space-y-3">
        {questions.map((q, index) => (
          <div key={q.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-sm text-slate-700">{q.question_text}</span>
            <StarInput
              value={scores[q.id] ?? 0}
              onChange={(v) => setScores((prev) => ({ ...prev, [q.id]: v }))}
              label={q.question_text}
              testId={`review-q${index + 1}`}
            />
          </div>
        ))}
        {previewRating != null && (
          <p className="text-sm text-slate-600">Vaša ukupna ocjena: <span className="font-semibold">{formatRating(previewRating)}</span> / 5</p>
        )}
      </div>

      <div>
        <label htmlFor="review-month" className="block text-sm font-medium text-slate-700 mb-1">Kada ste koristili uslugu?</label>
        <select
          id="review-month"
          data-testid="review-month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 mb-1">Vaše iskustvo (nije obavezno)</label>
        <textarea
          id="review-comment"
          data-testid="review-comment-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Ne upisujte zdravstvene podatke ni kontakt podatke (telefon, e-mail).</span>
          <span>{comment.length}/{MAX_COMMENT}</span>
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          data-testid="review-confirm"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>Potvrđujem da sam koristio/la ovu uslugu i da je recenzija iskrena.</span>
      </label>

      <UnverifiedNote />

      {error && <p data-testid="review-error" role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          data-testid="review-submit"
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Spremanje...' : 'Objavi recenziju'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-white"
        >
          Odustani
        </button>
      </div>
    </form>
  );
}
