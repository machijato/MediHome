import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface MyProfilePageProps {
  user: any;
}

const editableFields = [
  { key: 'display_name', label: 'Ime / naziv', type: 'text', testid: 'input-display-name' },
  { key: 'phone', label: 'Telefon', type: 'tel', testid: 'input-phone' },
  { key: 'email', label: 'Email', type: 'email', testid: 'input-email' },
  { key: 'website', label: 'Web stranica', type: 'url', testid: 'input-website' },
  { key: 'city', label: 'Grad', type: 'text', testid: 'input-city' },
];

export const MyProfilePage: React.FC<MyProfilePageProps> = ({ user }) => {
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    bio: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from('provider_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
          setFormData({
            display_name: profileData.display_name ?? '',
            phone: profileData.phone ?? '',
            email: profileData.email ?? '',
            website: profileData.website ?? '',
            city: profileData.city ?? '',
            bio: profileData.bio ?? '',
          });
        }

        if (profileData?.id) {
          const { data: listingsData } = await supabase
            .from('provider_listings')
            .select('id, slug, title, status, city, price_from, price_unit, created_at')
            .eq('provider_profile_id', profileData.id)
            .order('created_at', { ascending: false });

          setListings(listingsData ?? []);
        } else {
          setListings([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        display_name: formData.display_name,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        city: formData.city,
        bio: formData.bio,
      })
      .eq('user_id', user.id);

    setSaving(false);

    if (error) {
      setSaveError('Greška pri spremanju. Pokušajte ponovno.');
    } else {
      setProfile((prev: any) => (prev ? { ...prev, ...formData } : prev));
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDeactivateListing = async (listingId: string) => {
    const { error } = await supabase
      .from('provider_listings')
      .update({ status: 'draft' })
      .eq('id', listingId)
      .eq('provider_profile_id', profile?.id);

    if (!error) {
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status: 'draft' } : l)));
    }
  };

  return (
    <main
      data-testid="my-profile-page"
      className="max-w-4xl mx-auto px-4 py-10 space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Moj profil</h1>
        {!isEditing && (
          <button
            data-testid="edit-profile-button"
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors"
          >
            Uredi profil
          </button>
        )}
      </div>

      {loading && <p>Učitavanje...</p>}

      {!loading && (
        <>
          <div
            data-testid="profile-card"
            className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">Kontakt podaci</h2>

            {isEditing ? (
              <div className="space-y-4">
                {editableFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      data-testid={field.testid}
                      type={field.type}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                  <textarea
                    data-testid="input-bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {saveError && (
                  <p data-testid="save-error" className="text-sm text-red-600">{saveError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    data-testid="save-profile-button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Spremanje...' : 'Spremi'}
                  </button>
                  <button
                    data-testid="cancel-edit-button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Odustani
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-600">
                {saveSuccess && (
                  <p data-testid="save-success" className="text-green-600 font-medium">
                    Profil uspješno spremljen!
                  </p>
                )}
                <p><span className="font-medium">Ime:</span> {profile?.display_name ?? '—'}</p>
                <p><span className="font-medium">Telefon:</span> {profile?.phone ?? '—'}</p>
                <p><span className="font-medium">Email:</span> {profile?.email ?? '—'}</p>
                <p><span className="font-medium">Web:</span> {profile?.website ?? '—'}</p>
                <p><span className="font-medium">Grad:</span> {profile?.city ?? '—'}</p>
                {profile?.bio && <p><span className="font-medium">Bio:</span> {profile.bio}</p>}
              </div>
            )}
          </div>

          <div data-testid="my-listings-section">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Moji oglasi ({listings.length})
            </h2>

            {listings.length === 0 ? (
              <p className="text-slate-500 text-sm">Nemate još objavljenih oglasa.</p>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    data-testid="my-listing-item"
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          listing.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {listing.status === 'approved' ? 'Aktivno' : 'Neaktivno'}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 truncate">{listing.title}</p>
                      <p className="text-sm text-slate-500">{listing.city} · {listing.price_from} {listing.price_unit}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {listing.slug && (
                        <Link
                          to={`/oglas/${listing.slug}`}
                          data-testid="my-listing-view-link"
                          className="text-sm text-primary hover:underline"
                        >
                          Pregledaj
                        </Link>
                      )}
                      {listing.status === 'approved' && (
                        <button
                          data-testid="deactivate-listing-button"
                          onClick={() => handleDeactivateListing(listing.id)}
                          className="text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1 border border-slate-200 rounded-lg hover:border-red-200"
                        >
                          Deaktiviraj
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};
