import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

const CATEGORY_CONTENT: Record<string, { title: string; description: string; intro: string }> = {
  'fizioterapeut': {
    title: 'Fizioterapeuti u Hrvatskoj',
    description: 'Pronađite provjerene fizioterapeute za rehabilitaciju, sportske ozljede i kroničnu bol.',
    intro: 'Fizioterapija pomaže u oporavku od ozljeda, operacija i kroničnih bolova. Pregledajte popis stručnih fizioterapeuta u vašoj blizini.',
  },
  'kucna-njega': {
    title: 'Kućna zdravstvena njega',
    description: 'Profesionalna njega u kući za starije osobe i osobe s posebnim potrebama.',
    intro: 'Kućna njega omogućuje kvalitetnu zdravstvenu skrb u poznatom i sigurnom okruženju vlastitog doma.',
  },
  'najam-opreme': {
    title: 'Najam medicinske opreme',
    description: 'Invalidska kolica, bolnički kreveti i medicinska oprema za najam.',
    intro: 'Pronađite pouzdane pružatelje opreme za kućnu njegu i rehabilitaciju, dostupne za kratkoročni i dugoročni najam.',
  },
  'sanitetski-prijevoz': {
    title: 'Sanitetski prijevoz',
    description: 'Siguran prijevoz pacijenata i osoba s invaliditetom.',
    intro: 'Sanitetski prijevoz osigurava siguran i udoban transport za medicinske posjete, otpuste iz bolnice i druge potrebe.',
  },
};

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const content = categorySlug ? CATEGORY_CONTENT[categorySlug] : undefined;

  useEffect(() => {
    if (!categorySlug) return;

    const fetchListings = async () => {
      setLoading(true);

      const { data: category } = await supabase
        .from('service_categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (!category) {
        setListings([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('provider_listings')
        .select('id, slug, title, description, city, price_from, price_unit, listing_images(*)')
        .eq('category_id', category.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(24);

      setListings(data ?? []);
      setLoading(false);
    };

    fetchListings();
  }, [categorySlug]);

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Kategorija nije pronađena.</p>
        <Link to="/" data-testid="category-not-found-back-link" className="text-primary hover:underline mt-4 inline-block">← Povratak na početnu</Link>
      </div>
    );
  }

  return (
    <div data-testid="category-page" className="max-w-7xl mx-auto px-4 py-10">
      <SEO title={content.title} description={content.description} canonicalPath={`/kategorija/${categorySlug}`} />

      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{content.title}</h1>
        <p className="text-slate-600 leading-relaxed">{content.intro}</p>
      </div>

      {loading && <p className="text-slate-500">Učitavanje...</p>}

      {!loading && listings.length === 0 && (
        <div className="text-center py-16 bg-slate-50 rounded-2xl">
          <p className="text-slate-400">Trenutno nema oglasa u ovoj kategoriji.</p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => {
            const primaryImage = listing.listing_images?.find((img: any) => img.is_primary) ?? listing.listing_images?.[0];
            const imageUrl = primaryImage?.image_url ?? `https://picsum.photos/seed/${listing.id}/400/300`;

            return listing.slug ? (
              <Link key={listing.id} to={`/oglas/${listing.slug}`} data-testid="listing-card" className="block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <img src={imageUrl} alt={listing.title} className="w-full h-40 object-cover" loading="lazy" />
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 truncate">{listing.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{listing.city}</p>
                  <p className="text-sm font-medium text-primary mt-2">{listing.price_from} {listing.price_unit}</p>
                </div>
              </Link>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
