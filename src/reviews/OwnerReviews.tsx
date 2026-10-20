import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ReviewItem } from './ReviewsSection';
import { UnverifiedNote } from './Stars';
import { REPORT_REASONS, REVIEW_SELECT, Review, replyOf } from './types';

type OwnerReview = Review & { provider_listings?: { title: string | null; slug: string | null } | null };
type MyReport = { review_id: string; status: 'open' | 'accepted' | 'rejected'; reason: string };

const REPORT_STATUS_LABEL: Record<MyReport['status'], string> = {
  open: 'Prijava je poslana i čeka pregled administratora.',
  accepted: 'Prijava je prihvaćena, recenzija je uklonjena ili ispravljena.',
  rejected: 'Prijava je odbijena, recenzija ostaje objavljena.',
};

// Odjeljak "Recenzije mojih oglasa" u Moj profil: odgovor na recenziju i prijava neprimjerene recenzije.
export function OwnerReviews({ profileId, user }: { profileId: string; user: any }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [reports, setReports] = useState<Record<string, MyReport>>({});

  const load = useCallback(async () => {
    const [reviewsRes, reportsRes] = await Promise.all([
      supabase
        .from('listing_reviews')
        .select(`${REVIEW_SELECT}, provider_listings(title, slug)`)
        .eq('provider_profile_id', profileId)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
      supabase.from('review_reports').select('review_id, status, reason').eq('reporter_user_id', user.id),
    ]);

    if (reviewsRes.error || reportsRes.error) {
      console.error('[owner-reviews] load failed:', reviewsRes.error?.message ?? reportsRes.error?.message);
      setError(true);
      setLoading(false);
      return;
    }

    setError(false);
    setReviews(((reviewsRes.data ?? []) as unknown as OwnerReview[]).map((r) => ({ ...r, rating: Number(r.rating) })));
    setReports(Object.fromEntries(((reportsRes.data ?? []) as MyReport[]).map((r) => [r.review_id, r])));
    setLoading(false);
  }, [profileId, user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div data-testid="owner-reviews-section">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Recenzije mojih oglasa ({reviews.length})</h2>
      <UnverifiedNote className="mb-4" />

      {loading ? (
        <p className="text-sm text-slate-500">Učitavanje...</p>
      ) : error ? (
        <p className="text-sm text-red-600">Recenzije trenutno nije moguće učitati.</p>
      ) : reviews.length === 0 ? (
        <p data-testid="owner-reviews-empty" className="text-sm text-slate-500">Vaši oglasi još nemaju recenzija.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              {review.provider_listings?.title && (
                <p className="text-xs text-slate-500 mb-3">
                  Oglas:{' '}
                  {review.provider_listings.slug ? (
                    <Link to={`/oglas/${review.provider_listings.slug}`} className="text-primary hover:underline">
                      {review.provider_listings.title}
                    </Link>
                  ) : (
                    review.provider_listings.title
                  )}
                </p>
              )}
              <ul>
                <ReviewItem review={review}>
                  <OwnerActions review={review} report={reports[review.id]} onChanged={load} />
                </ReviewItem>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerActions({ review, report, onChanged }: { review: OwnerReview; report?: MyReport; onChanged: () => Promise<void> }) {
  const reply = replyOf(review);
  const [mode, setMode] = useState<'none' | 'reply' | 'report'>('none');
  const [replyText, setReplyText] = useState(reply?.reply_text ?? '');
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const saveReply = async () => {
    const text = replyText.trim();
    if (!text) {
      setMessage('Upišite tekst odgovora.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await supabase.from('review_replies').upsert({ review_id: review.id, reply_text: text }, { onConflict: 'review_id' });
    setBusy(false);
    if (error) {
      console.error('[owner-reviews] reply failed:', error.message);
      setMessage('Odgovor nije moguće spremiti. Pokušajte ponovno.');
      return;
    }
    setMode('none');
    await onChanged();
  };

  const deleteReply = async () => {
    setBusy(true);
    const { error } = await supabase.from('review_replies').delete().eq('review_id', review.id);
    setBusy(false);
    if (error) {
      setMessage('Odgovor nije moguće obrisati.');
      return;
    }
    setReplyText('');
    await onChanged();
  };

  const sendReport = async () => {
    setBusy(true);
    setMessage('');
    const { error } = await supabase
      .from('review_reports')
      .insert({ review_id: review.id, reason, details: details.trim() === '' ? null : details.trim() });
    setBusy(false);
    if (error) {
      console.error('[owner-reviews] report failed:', error.message);
      setMessage(error.code === '23505' ? 'Ovu recenziju ste već prijavili.' : 'Prijavu nije moguće poslati. Pokušajte ponovno.');
      return;
    }
    setMode('none');
    setDetails('');
    await onChanged();
  };

  return (
    <div className="mt-3 space-y-3">
      {report && (
        <p data-testid="owner-report-status" className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {REPORT_STATUS_LABEL[report.status]}
        </p>
      )}

      {mode === 'none' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="owner-reply-open"
            onClick={() => setMode('reply')}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-primary/40 hover:text-primary"
          >
            {reply ? 'Uredi odgovor' : 'Odgovori'}
          </button>
          {reply && (
            <button
              type="button"
              onClick={deleteReply}
              disabled={busy}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-red-200 hover:text-red-600"
            >
              Obriši odgovor
            </button>
          )}
          {!report && (
            <button
              type="button"
              data-testid="owner-report-open"
              onClick={() => setMode('report')}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-red-200 hover:text-red-600"
            >
              Prijavi recenziju
            </button>
          )}
        </div>
      )}

      {mode === 'reply' && (
        <div className="space-y-2">
          <textarea
            data-testid="owner-reply-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Vaš javni odgovor na recenziju"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <p className="text-xs text-slate-500">Odgovor je javno vidljiv. Ne upisujte zdravstvene podatke korisnika.</p>
          <div className="flex gap-2">
            <button type="button" data-testid="owner-reply-save" onClick={saveReply} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-60">
              {busy ? 'Spremanje...' : 'Spremi odgovor'}
            </button>
            <button type="button" onClick={() => setMode('none')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700">Odustani</button>
          </div>
        </div>
      )}

      {mode === 'report' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`report-reason-${review.id}`}>Razlog prijave</label>
          <select
            id={`report-reason-${review.id}`}
            data-testid="owner-report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <textarea
            data-testid="owner-report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Objašnjenje za administratora (nije obavezno)"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" data-testid="owner-report-send" onClick={sendReport} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white disabled:opacity-60">
              {busy ? 'Slanje...' : 'Pošalji prijavu'}
            </button>
            <button type="button" onClick={() => setMode('none')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700">Odustani</button>
          </div>
        </div>
      )}

      {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
