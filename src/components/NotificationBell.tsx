import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

const WINDOW_DAYS = 10;
const REFRESH_MS = 5 * 60 * 1000;

type NotificationItem = {
  key: string;
  kind: 'review' | 'reply' | 'listing';
  text: string;
  detail?: string;
  to: string;
  createdAt: string;
};

type AdminCounts = { pendingListings: number; openReports: number };

function seenKey(userId: string) {
  return `medihome:notifications-seen:${userId}`;
}

function readSeen(userId: string): string | null {
  try {
    return window.localStorage.getItem(seenKey(userId));
  } catch {
    return null;
  }
}

function writeSeen(userId: string, value: string) {
  try {
    window.localStorage.setItem(seenKey(userId), value);
  } catch {
    // Privatni način rada: obavijesti ostaju "nove" do sljedećeg učitavanja, bez posljedica.
  }
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'danas';
  if (days === 1) return 'jučer';
  return `prije ${days} dana`;
}

// Zvonce s obavijestima iz postojećih podataka (bez posebne tablice): nove recenzije na moje oglase,
// odgovori na moje recenzije i novi oglasi u zadnjih 10 dana. Admin dodatno vidi što čeka obradu.
export function NotificationBell({ user, isAdmin }: { user: any; isAdmin: boolean }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [admin, setAdmin] = useState<AdminCounts>({ pendingListings: 0, openReports: 0 });
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  // Vrijeme zadnjeg pregleda prije otvaranja panela (za isticanje novih stavki dok je panel otvoren).
  const [highlightAfter, setHighlightAfter] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const userId: string = user.id;

  useEffect(() => {
    setSeenAt(readSeen(userId));
  }, [userId]);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
    const next: NotificationItem[] = [];
    let failed = false;

    const { data: profile } = await supabase.from('provider_profiles').select('id').eq('user_id', userId).maybeSingle();
    const profileId: string | null = profile?.id ?? null;

    if (profileId) {
      const { data, error } = await supabase
        .from('listing_reviews')
        .select('id, reviewer_name, rating, created_at, provider_listings(title, slug)')
        .eq('provider_profile_id', profileId)
        .eq('status', 'published')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) failed = true;
      for (const r of (data ?? []) as any[]) {
        const listing = Array.isArray(r.provider_listings) ? r.provider_listings[0] : r.provider_listings;
        next.push({
          key: `review-${r.id}`,
          kind: 'review',
          text: `${r.reviewer_name} je ocijenio/la vaš oglas ocjenom ${Number(r.rating).toFixed(1).replace('.', ',')}`,
          detail: listing?.title ?? undefined,
          to: listing?.slug ? `/oglas/${listing.slug}` : '/moj-profil',
          createdAt: r.created_at,
        });
      }
    }

    const { data: myReviews, error: myReviewsError } = await supabase
      .from('listing_reviews')
      .select('id, provider_listings(title, slug)')
      .eq('reviewer_user_id', userId)
      .limit(100);
    if (myReviewsError) failed = true;
    const myReviewRows = (myReviews ?? []) as any[];
    if (myReviewRows.length > 0) {
      const { data: replies, error } = await supabase
        .from('review_replies')
        .select('review_id, created_at')
        .in('review_id', myReviewRows.map((r) => r.id))
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) failed = true;
      for (const reply of (replies ?? []) as any[]) {
        const row = myReviewRows.find((r) => r.id === reply.review_id);
        const listing = Array.isArray(row?.provider_listings) ? row.provider_listings[0] : row?.provider_listings;
        next.push({
          key: `reply-${reply.review_id}`,
          kind: 'reply',
          text: 'Pružatelj je odgovorio na vašu recenziju',
          detail: listing?.title ?? undefined,
          to: listing?.slug ? `/oglas/${listing.slug}` : '/',
          createdAt: reply.created_at,
        });
      }
    }

    let listingsQuery = supabase
      .from('provider_listings')
      .select('id, slug, title, city, created_at')
      .eq('status', 'approved')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10);
    if (profileId) listingsQuery = listingsQuery.neq('provider_profile_id', profileId);
    const { data: newListings, error: listingsError } = await listingsQuery;
    if (listingsError) failed = true;
    for (const l of (newListings ?? []) as any[]) {
      if (!l.slug) continue;
      next.push({
        key: `listing-${l.id}`,
        kind: 'listing',
        text: `Novi oglas: ${l.title ?? 'Bez naslova'}`,
        detail: l.city ?? undefined,
        to: `/oglas/${l.slug}`,
        createdAt: l.created_at,
      });
    }

    if (isAdmin) {
      const [pendingRes, reportsRes] = await Promise.all([
        supabase.from('provider_listings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('review_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      setAdmin({ pendingListings: pendingRes.count ?? 0, openReports: reportsRes.count ?? 0 });
    } else {
      setAdmin({ pendingListings: 0, openReports: 0 });
    }

    next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setItems(next);
    setLoadError(failed);
  }, [userId, isAdmin]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isUnseen = (item: NotificationItem, reference: string | null) => !reference || item.createdAt > reference;
  const adminTodo = admin.pendingListings + admin.openReports;
  const unseenCount = items.filter((i) => isUnseen(i, seenAt)).length + adminTodo;

  const toggle = () => {
    if (!open) {
      setHighlightAfter(seenAt);
      const now = new Date().toISOString();
      setSeenAt(now);
      writeSeen(userId, now);
      void load();
    }
    setOpen(!open);
  };

  const reviewItems = items.filter((i) => i.kind === 'review' || i.kind === 'reply');
  const listingItems = items.filter((i) => i.kind === 'listing');

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-testid="notification-bell"
        aria-label={unseenCount > 0 ? `Obavijesti (${unseenCount} novih)` : 'Obavijesti'}
        aria-expanded={open}
        onClick={toggle}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unseenCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center"
          >
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-panel"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900">Obavijesti</p>
            <p className="text-xs text-slate-500">Zadnjih {WINDOW_DAYS} dana</p>
          </div>

          {isAdmin && adminTodo > 0 && (
            <div data-testid="notification-admin" className="px-4 py-3 border-b border-slate-100 bg-amber-50 space-y-1">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Za administratora</p>
              {admin.pendingListings > 0 && (
                <Link to="/admin" onClick={() => setOpen(false)} className="block text-sm text-slate-800 hover:text-primary">
                  Oglasa čeka odobrenje: <span className="font-semibold">{admin.pendingListings}</span>
                </Link>
              )}
              {admin.openReports > 0 && (
                <Link to="/admin" onClick={() => setOpen(false)} className="block text-sm text-slate-800 hover:text-primary">
                  Otvorenih prijava recenzija: <span className="font-semibold">{admin.openReports}</span>
                </Link>
              )}
            </div>
          )}

          {loadError && <p className="px-4 py-2 text-xs text-red-600">Neke obavijesti nije moguće učitati.</p>}

          {reviewItems.length > 0 && (
            <Section title="Recenzije">
              {reviewItems.map((item) => (
                <Row key={item.key} item={item} fresh={isUnseen(item, highlightAfter)} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}

          {listingItems.length > 0 && (
            <Section title="Novi oglasi">
              {listingItems.map((item) => (
                <Row key={item.key} item={item} fresh={isUnseen(item, highlightAfter)} onClick={() => setOpen(false)} />
              ))}
              <Link
                to="/?sort=najnovije"
                data-testid="notification-all-new"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-primary hover:bg-slate-50"
              >
                Pogledaj sve najnovije oglase →
              </Link>
            </Section>
          )}

          {items.length === 0 && adminTodo === 0 && !loadError && (
            <p data-testid="notification-empty" className="px-4 py-6 text-sm text-slate-500 text-center">Nema novih obavijesti.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      <ul>{children}</ul>
    </div>
  );
}

function Row({ item, fresh, onClick }: { item: NotificationItem; fresh: boolean; onClick: () => void; key?: React.Key }) {
  return (
    <li>
      <Link
        to={item.to}
        data-testid="notification-item"
        data-fresh={fresh ? 'true' : 'false'}
        onClick={onClick}
        className={`block px-4 py-2.5 hover:bg-slate-50 ${fresh ? 'bg-primary/5' : ''}`}
      >
        <p className="text-sm text-slate-800">{item.text}</p>
        <p className="text-xs text-slate-500">
          {item.detail ? `${item.detail} · ` : ''}{relativeDate(item.createdAt)}
        </p>
      </Link>
    </li>
  );
}
