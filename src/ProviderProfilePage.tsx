import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';

type ProviderProfile = {
  id: string;
  display_name: string | null;
  provider_type: string | null;
  city: string | null;
  county: string | null;
  phone: string | string[] | null;
  email: string | null;
  website: string | null;
};

type ProviderListing = {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  city: string | null;
  price_from: string | number | null;
  price_unit: string | null;
};

export function ProviderProfilePage() {
  const { profileId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [listings, setListings] = useState<ProviderListing[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      if (!profileId) {
        setLoading(false);
        setProfile(null);
        setListings([]);
        return;
      }

      setLoading(true);

      const { data: profileData } = await supabase
        .from('provider_profiles')
        .select('id, display_name, provider_type, city, county, phone, email, website')
        .eq('id', profileId)
        .maybeSingle();

      const { data: listingsData } = await supabase
        .from('provider_listings')
        .select('id, slug, title, description, city, price_from, price_unit')
        .eq('provider_profile_id', profileId)
        .eq('status', 'approved');

      if (!isMounted) return;

      setProfile(profileData ?? null);
      setListings(listingsData ?? []);
      setLoading(false);
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [profileId]);

  const initials = useMemo(() => {
    if (!profile?.display_name) return '?';
    return profile.display_name.trim().slice(0, 2).toUpperCase() || '?';
  }, [profile?.display_name]);

  const phoneEntries = useMemo(() => {
    if (!profile?.phone) return [];
    return Array.isArray(profile.phone) ? profile.phone.filter(Boolean) : [profile.phone];
  }, [profile?.phone]);

  if (loading) {
    return (
      <main data-testid="provider-profile-page" className="max-w-4xl mx-auto px-4 py-10">
        <p>Učitavanje...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main data-testid="provider-profile-page" className="max-w-4xl mx-auto px-4 py-10">
        <p>Profil nije pronađen.</p>
      </main>
    );
  }

  return (
    <main data-testid="provider-profile-page" className="max-w-4xl mx-auto px-4 py-10">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div data-testid="provider-profile-avatar" className="w-14 h-14 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
            {initials}
          </div>
          <div>
            <h1 data-testid="provider-profile-name" className="text-2xl font-bold text-slate-900">{profile.display_name || 'Nepoznato'}</h1>
            <p className="text-sm text-slate-600">Tip: {profile.provider_type || 'Nije navedeno'}</p>
            <p className="text-sm text-slate-600">Lokacija: {profile.city || profile.county || 'Nepoznato'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {phoneEntries[0] && (
            <a
              data-testid="provider-profile-phone-link"
              href={`tel:${phoneEntries[0]}`}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-h-11 bg-primary text-white hover:bg-primary/90"
            >
              Nazovi
            </a>
          )}
          {profile.email && (
            <a
              data-testid="provider-profile-email-link"
              href={`mailto:${profile.email}`}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-h-11 border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Pošalji email
            </a>
          )}
          {profile.website && (
            <a
              data-testid="provider-profile-website-link"
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-h-11 border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Web stranica
            </a>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Aktivni oglasi ({listings.length})</h2>

        {listings.length > 0 ? (
          <div data-testid="provider-profile-listings" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((listing) => {
              const priceText = [listing.price_from, listing.price_unit].filter(Boolean).join(' ') || 'Po dogovoru';

              return (
                <article key={listing.id} data-testid="provider-profile-listing-card" className="border border-slate-200 rounded-xl p-4">
                  {listing.slug ? (
                    <Link to={`/oglas/${listing.slug}`} className="text-lg font-semibold text-slate-900 hover:text-primary">
                      {listing.title || 'Bez naslova'}
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">{listing.title || 'Bez naslova'}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-1">{listing.city || 'Nepoznato'}</p>
                  <p className="text-sm text-primary font-medium mt-2">{priceText}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <p data-testid="provider-profile-listings" className="text-slate-500">Ovaj pružatelj trenutno nema aktivnih oglasa.</p>
        )}
      </section>
    </main>
  );
}
