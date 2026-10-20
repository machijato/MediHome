import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ReviewItem } from './ReviewsSection';
import { UnverifiedNote } from './Stars';
import { REVIEW_SELECT, Review } from './types';
import { MyReport, OwnerActions } from './OwnerActions';

type OwnerReview = Review & { provider_listings?: { title: string | null; slug: string | null } | null };

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

