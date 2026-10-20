import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ReviewItem } from './ReviewsSection';
import { formatDate } from './Stars';
import { REVIEW_SELECT, Review, reasonLabel } from './types';

type AdminReview = Review & { provider_listings?: { title: string | null; slug: string | null } | null };
type AdminReport = {
  id: string;
  review_id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'accepted' | 'rejected';
  created_at: string;
  listing_reviews: AdminReview | null;
};

type StatusFilter = 'all' | 'published' | 'hidden';

// Admin kartica "Recenzije": obrada prijava i potpuna kontrola nad recenzijama (sakrij, objavi, uredi tekst, obriši).
export function AdminReviews({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    const [reportsRes, reviewsRes] = await Promise.all([
      supabase
        .from('review_reports')
        .select(`id, review_id, reason, details, status, created_at, listing_reviews(${REVIEW_SELECT}, provider_listings(title, slug))`)
        .eq('status', 'open')
        .order('created_at', { ascending: true }),
      supabase
        .from('listing_reviews')
        .select(`${REVIEW_SELECT}, provider_listings(title, slug)`)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (reportsRes.error || reviewsRes.error) {
      console.error('[admin-reviews] load failed:', reportsRes.error?.message ?? reviewsRes.error?.message);
      setError('Recenzije nije moguće učitati.');
      setLoading(false);
      return;
    }

    setError('');
    setReports(((reportsRes.data ?? []) as unknown as AdminReport[]).map((r) => ({
      ...r,
      listing_reviews: r.listing_reviews ? { ...r.listing_reviews, rating: Number(r.listing_reviews.rating) } : null,
    })));
    setReviews(((reviewsRes.data ?? []) as unknown as AdminReview[]).map((r) => ({ ...r, rating: Number(r.rating) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleReviews = reviews.filter((r) => filter === 'all' || r.status === filter);

  return (
    <div data-testid="admin-reviews" className="space-y-10">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-slate-500">Učitavanje...</p>}

      {!loading && (
        <>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Otvorene prijave ({reports.length})</h2>
            {reports.length === 0 ? (
              <p data-testid="admin-reports-empty" className="text-sm text-slate-500">Nema otvorenih prijava.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} user={user} onChanged={load} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Sve recenzije ({visibleReviews.length})</h2>
              <select
                data-testid="admin-reviews-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="all">Sve</option>
                <option value="published">Objavljene</option>
                <option value="hidden">Skrivene</option>
              </select>
            </div>
            {visibleReviews.length === 0 ? (
              <p className="text-sm text-slate-500">Nema recenzija.</p>
            ) : (
              <div className="space-y-4">
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} onChanged={load} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ListingLine({ review }: { review: AdminReview }) {
  if (!review.provider_listings?.title) return null;
  return (
    <p className="text-xs text-slate-500 mb-3">
      Oglas:{' '}
      {review.provider_listings.slug ? (
        <Link to={`/oglas/${review.provider_listings.slug}`} className="text-primary hover:underline">{review.provider_listings.title}</Link>
      ) : (
        review.provider_listings.title
      )}
      {review.status === 'hidden' && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Skrivena</span>}
    </p>
  );
}

function ReportCard({ report, user, onChanged }: { report: AdminReport; user: any; onChanged: () => Promise<void>; key?: React.Key }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const review = report.listing_reviews;

  const resolve = async (accept: boolean) => {
    setBusy(true);
    setMessage('');
    if (accept && review) {
      const { error: hideError } = await supabase.from('listing_reviews').update({ status: 'hidden' }).eq('id', review.id);
      if (hideError) {
        setBusy(false);
        setMessage('Recenziju nije moguće sakriti.');
        return;
      }
    }
    const { error } = await supabase
      .from('review_reports')
      .update({
        status: accept ? 'accepted' : 'rejected',
        admin_note: note.trim() === '' ? null : note.trim(),
        handled_by: user?.id ?? null,
        handled_at: new Date().toISOString(),
      })
      .eq('id', report.id);
    setBusy(false);
    if (error) {
      setMessage('Prijavu nije moguće obraditi.');
      return;
    }
    await onChanged();
  };

  return (
    <div data-testid="admin-report-card" className="bg-white rounded-2xl border border-red-200 p-4">
      <p className="text-sm font-semibold text-red-700">{reasonLabel(report.reason)}</p>
      <p className="text-xs text-slate-500 mb-1">Prijavljeno {formatDate(report.created_at)}</p>
      {report.details && <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{report.details}</p>}

      {review ? (
        <div className="border-t border-slate-100 pt-3">
          <ListingLine review={review} />
          <ul><ReviewItem review={review} /></ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Recenzija više ne postoji.</p>
      )}

      <div className="mt-4 space-y-2">
        <input
          data-testid="admin-report-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bilješka administratora (nije obavezno)"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" data-testid="admin-report-accept" disabled={busy} onClick={() => resolve(true)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white disabled:opacity-60">
            Prihvati i sakrij recenziju
          </button>
          <button type="button" data-testid="admin-report-reject" disabled={busy} onClick={() => resolve(false)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 disabled:opacity-60">
            Odbij prijavu
          </button>
        </div>
        {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
}

function ReviewCard({ review, onChanged }: { review: AdminReview; onChanged: () => Promise<void>; key?: React.Key }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(review.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (action: () => PromiseLike<{ error: { message: string } | null }>, failure: string) => {
    setBusy(true);
    setMessage('');
    const { error } = await action();
    setBusy(false);
    if (error) {
      console.error('[admin-reviews] action failed:', error.message);
      setMessage(failure);
      return false;
    }
    await onChanged();
    return true;
  };

  const toggleHidden = () =>
    run(
      () => supabase.from('listing_reviews').update({ status: review.status === 'hidden' ? 'published' : 'hidden' }).eq('id', review.id),
      'Status recenzije nije moguće promijeniti.',
    );

  const saveComment = async () => {
    const ok = await run(
      () => supabase.from('listing_reviews').update({ comment: comment.trim() === '' ? null : comment.trim() }).eq('id', review.id),
      'Tekst nije moguće spremiti.',
    );
    if (ok) setEditing(false);
  };

  const remove = () => {
    if (!window.confirm('Trajno obrisati ovu recenziju? Ova radnja se ne može poništiti.')) return;
    void run(() => supabase.from('listing_reviews').delete().eq('id', review.id), 'Recenziju nije moguće obrisati.');
  };

  return (
    <div data-testid="admin-review-card" className="bg-white rounded-2xl border border-slate-200 p-4">
      <ListingLine review={review} />
      <ul><ReviewItem review={review} /></ul>

      {editing && (
        <div className="mt-3 space-y-2">
          <textarea
            data-testid="admin-review-edit-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <p className="text-xs text-slate-500">Uz recenziju će se javno prikazati da je tekst uredio moderator.</p>
          <div className="flex gap-2">
            <button type="button" onClick={saveComment} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-60">Spremi tekst</button>
            <button type="button" onClick={() => { setEditing(false); setComment(review.comment ?? ''); }} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700">Odustani</button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" data-testid="admin-review-toggle" disabled={busy} onClick={toggleHidden} className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-primary/40 hover:text-primary">
          {review.status === 'hidden' ? 'Objavi ponovno' : 'Sakrij'}
        </button>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-primary/40 hover:text-primary">
            Uredi tekst
          </button>
        )}
        <button type="button" data-testid="admin-review-delete" disabled={busy} onClick={remove} className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-red-200 hover:text-red-600">
          Obriši
        </button>
      </div>
      {message && <p role="alert" className="text-sm text-red-600 mt-2">{message}</p>}
    </div>
  );
}
