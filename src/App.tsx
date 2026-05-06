import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronDown, Activity, HeartPulse, Package, MapPin, PlusCircle, ArrowRight, ImageOff, UserRound } from 'lucide-react';
import { Navbar } from './Navbar';
import { CategorySection } from './CategorySection';
import { ListingCard } from './ListingCard';
import { ArticleSection } from './ArticleSection';
import { CreateListingModal } from './CreateListingModal';
import { AuthModal } from './components/AuthModal';
import { MOCK_PROVIDERS, Provider, ZUPANIJE } from './constants';
import { supabase } from './lib/supabase';
import { UvjetiKoristenja } from './pages/UvjetiKoristenja';
import { PolitikaPrivatnosti } from './pages/PolitikaPrivatnosti';
import { OdricanjeOdgovornosti } from './pages/OdricanjeOdgovornosti';
import { ResetPassword } from './pages/ResetPassword';

function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);

  const fetchProviders = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, slug');

      if (categoriesError) {
        throw categoriesError;
      }

      const categorySlugById = new Map(
        (categoriesData ?? []).map((category) => [category.id, category.slug]),
      );

      const mapCategoryToProviderType = (categoryId: string): Provider['type'] => {
        const slug = categorySlugById.get(categoryId);

        if (slug === 'fizioterapeut') return 'physio';
        if (slug === 'kucna-njega') return 'nurse';
        if (slug === 'najam-opreme') return 'equipment';
        if (slug === 'sanitetski-prijevoz') return 'transport';

        return 'other';
      };

      const { data: listingsData, error: listingsError } = await supabase
        .from('provider_listings')
        .select('id, slug, title, description, city, price_from, price_unit, category_id, status')
        .eq('status', 'approved');

      if (listingsError) {
        throw listingsError;
      }

      if (!listingsData || listingsData.length === 0) {
        setProviders(MOCK_PROVIDERS);
        return;
      }

      const mappedProviders: Provider[] = listingsData.map((listing) => ({
        id: String(listing.id),
        slug: listing.slug ?? null,
        name: listing.title ?? 'Bez naslova',
        type: mapCategoryToProviderType(String(listing.category_id)),
        rating: 5,
        reviewsCount: 0,
        price: [listing.price_from, listing.price_unit].filter(Boolean).join(' ') || 'Po dogovoru',
        location: listing.city ?? 'Nepoznato',
        image: 'https://picsum.photos/seed/provider/400/300',
        description: listing.description ?? '',
        tags: [],
      }));

      setProviders(mappedProviders);
    } catch (error) {
      console.error('Greška pri dohvaćanju oglasa iz Supabasea:', error);
      setProviders(MOCK_PROVIDERS);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleCreateListing = async () => {
    await fetchProviders();
  };


  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      return;
    }

    const hashParams = new URLSearchParams(hash.slice(1));
    const hashType = hashParams.get('type');

    if (hashType === 'recovery') {
      setIsRecoveryFlow(true);
      setIsAuthOpen(true);
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.type === activeCategory;
      const matchesCounty = selectedCounty === 'all' || p.location.includes(selectedCounty);
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesCounty && matchesSearch;
    });
  }, [activeCategory, selectedCounty, searchQuery, providers]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onPostAdClick={() => setIsModalOpen(true)}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogoutClick={handleLogout}
        user={user}
      />

      <main className="flex-1">
        <section className="relative py-20 overflow-hidden bg-white">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6"
              >
                Zdravstvena njega <br />
                <span className="text-primary">u vašem domu.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-500 mb-10 leading-relaxed"
              >
                Povezujemo vas s najboljim fizioterapeutima, medicinskim sestrama i dobavljačima opreme. Brzo,
                sigurno i pouzdano.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Što trebate danas?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-lg"
                  />
                </div>
                <button className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Pretraži
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        <CategorySection
          activeCategory={activeCategory}
          setActiveCategory={(id) => setActiveCategory(activeCategory === id ? 'all' : id)}
        />

        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-3 text-slate-900 font-bold shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Filtriraj po lokaciji:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCounty('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCounty === 'all'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sve lokacije
                  </button>
                  <div className="relative">
                    <select
                      value={selectedCounty === 'all' ? '' : selectedCounty}
                      onChange={(e) => setSelectedCounty(e.target.value || 'all')}
                      className="appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-medium transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none"
                    >
                      <option value="">Odaberite županiju</option>
                      {ZUPANIJE.map((county) => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center my-8">
              <h2 className="text-2xl font-bold text-slate-900">Istaknuti oglasi</h2>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filteri
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Sortiraj: Najbolje ocijenjeno
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProviders.map((provider) => (
                  provider.slug ? (
                    <Link key={provider.id} to={`/oglas/${provider.slug}`} data-testid="listing-card" className="block">
                      <ListingCard provider={provider} />
                    </Link>
                  ) : (
                    <div key={provider.id} data-testid="listing-card">
                      <ListingCard provider={provider} />
                    </div>
                  )
                ))}
              </AnimatePresence>
            </div>

            {filteredProviders.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nema rezultata</h3>
                <p className="text-slate-500">Pokušajte promijeniti filtere ili pojam pretrage.</p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedCounty('all');
                    setSearchQuery('');
                  }}
                  className="mt-6 text-primary font-bold hover:underline"
                >
                  Prikaži sve oglase
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative bg-slate-900 rounded-[40px] overflow-hidden p-8 md:p-16">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl text-center md:text-left">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
                    Nudite zdravstvene usluge ili opremu? <br />
                    <span className="text-primary">Postanite dio MediHome tima.</span>
                  </h2>
                  <p className="text-slate-400 text-lg mb-8">
                    Pridružite se tisućama stručnjaka i tvrtki koji već koriste našu platformu za povezivanje s
                    korisnicima. Brza objava, velika vidljivost.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      data-testid="open-create-listing-cta"
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Objavi oglas
                    </button>
                    <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2">
                      Saznaj više
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="hidden lg:block relative">
                  <div className="w-64 h-64 bg-primary/10 rounded-full animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlusCircle className="w-32 h-32 text-primary opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ArticleSection />
      </main>

      <CreateListingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateListing} />
      <AuthModal
        open={isAuthOpen}
        isRecovery={isRecoveryFlow}
        onClose={() => {
          setIsAuthOpen(false);
          setIsRecoveryFlow(false);
        }}
      />

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">M</div>
                <span className="text-xl font-bold text-slate-900">MediHome</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Vaš partner u pronalaženju najbolje kućne njege i medicinske opreme. Povezujemo stručnjake s onima
                kojima je pomoć najpotrebnija.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Usluge</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><button onClick={() => setActiveCategory('physio')} className="hover:text-primary transition-colors text-left">Fizikalna terapija</button></li>
                <li><button onClick={() => setActiveCategory('nurse')} className="hover:text-primary transition-colors text-left">Medicinska njega</button></li>
                <li><button onClick={() => setActiveCategory('equipment')} className="hover:text-primary transition-colors text-left">Najam opreme</button></li>
                <li><button onClick={() => setActiveCategory('other')} className="hover:text-primary transition-colors text-left">Ljekarne i dućani</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Informacije</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link to="/uvjeti-koristenja" className="hover:text-primary transition-colors">Opći uvjeti korištenja</Link></li>
                <li><Link to="/politika-privatnosti" className="hover:text-primary transition-colors">Politika privatnosti</Link></li>
                <li><Link to="/odricanje-odgovornosti" className="hover:text-primary transition-colors">Odricanje od odgovornosti</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Kontakt</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li>info@medihome.hr</li>
                <li>+385 1 234 5678</li>
                <li>Zagreb, Hrvatska</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">© 2024 MediHome. Sva prava pridržana.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Activity className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><HeartPulse className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Package className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ListingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchListing = async () => {
      if (!slug) {
        if (isMounted) {
          setIsNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      setIsNotFound(false);
      setIsLoading(true);

      const { data, error } = await supabase
        .from('provider_listings')
        .select(`
          title,
          description,
          price_from,
          price_unit,
          city,
          service_categories(name, slug),
          provider_profiles(display_name, provider_type, city, county, phone, email, website),
          listing_selected_options(
            service_options(label, value, display_order, service_option_groups(name, display_order))
          )
        `)
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data) {
        setListing(null);
        setIsNotFound(true);
      } else {
        setListing(data);
        setIsNotFound(false);
      }

      setIsLoading(false);
    };

    fetchListing();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) return <main data-testid="listing-detail-page" className="max-w-4xl mx-auto px-4 py-12">Učitavanje...</main>;
  if (isNotFound || !listing) return <main data-testid="listing-detail-page" className="max-w-4xl mx-auto px-4 py-12">Oglas nije pronađen.</main>;

  const selectedOptions = (listing.listing_selected_options ?? [])
    .map((item: any) => item.service_options)
    .filter(Boolean);

  const groupedOptions = selectedOptions.reduce((acc: Record<string, any[]>, option: any) => {
    const groupName = option.service_option_groups?.name || 'Ostalo';
    acc[groupName] = [...(acc[groupName] ?? []), option];
    return acc;
  }, {});

  const hasGroupMetadata = selectedOptions.some((option: any) => option.service_option_groups?.name);
  const sortedGroupEntries = Object.entries(groupedOptions as Record<string, any[]>).sort(([groupA], [groupB]) => groupA.localeCompare(groupB, 'hr'));
  const phoneEntries = (() => {
    const rawPhone = listing.provider_profiles?.phone;
    if (!rawPhone) return [];
    return Array.isArray(rawPhone) ? rawPhone.filter(Boolean) : [rawPhone];
  })();
  const hasContactData = Boolean(
    phoneEntries.length > 0 || listing.provider_profiles?.email || listing.provider_profiles?.website,
  );

  return (
    <main data-testid="listing-detail-page" className="max-w-6xl mx-auto px-4 py-10 md:py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h1 data-testid="listing-detail-title" className="text-3xl md:text-4xl font-bold text-slate-900 mb-5">{listing.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          {listing.service_categories?.name && <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">{listing.service_categories.name}</span>}
          <span data-testid="listing-detail-city" className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{listing.city || 'Nepoznato'}</span>
          <span data-testid="listing-detail-price" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold">{[listing.price_from, listing.price_unit].filter(Boolean).join(' ') || 'Po dogovoru'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="lg:col-span-2 space-y-6">
          <article className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Opis usluge</h2>
            <p data-testid="listing-detail-description" className="text-slate-700 leading-relaxed whitespace-pre-wrap">{listing.description || 'Nema dostupnog opisa.'}</p>
          </article>

          {selectedOptions.length > 0 ? (
            <section data-testid="listing-detail-options" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Usluge i specijalizacije</h2>
              {hasGroupMetadata ? (
                <div className="space-y-5">
                  {sortedGroupEntries.map(([groupName, groupOptions]) => (
                    <div key={groupName}>
                      <h3 className="text-sm font-semibold text-slate-600 mb-2">{groupName}</h3>
                      <div className="flex flex-wrap gap-2">
                        {groupOptions.map((option: any) => (
                          <span key={option.value} data-testid="listing-detail-option" className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium">{option.label}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedOptions.map((option: any) => (
                    <span key={option.value} data-testid="listing-detail-option" className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium">{option.label}</span>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section data-testid="listing-detail-options" className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Usluge i specijalizacije</h2>
              <p className="text-sm text-slate-500">Nema dodatno označenih usluga.</p>
            </section>
          )}
        </section>

        <aside className="space-y-6">
          <div data-testid="listing-detail-contact-card" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pružatelj i kontakt</h2>
            <p data-testid="listing-detail-provider" className="text-slate-800 font-medium mb-3 flex items-center gap-2"><UserRound className="w-4 h-4 text-slate-500" />{listing.provider_profiles?.display_name || 'Nepoznato'}</p>
            <p className="text-sm text-slate-600 mb-1">Tip: {listing.provider_profiles?.provider_type || 'Nije navedeno'}</p>
            <p className="text-sm text-slate-600 mb-4">Lokacija: {listing.provider_profiles?.city || listing.provider_profiles?.county || listing.city || 'Nepoznato'}</p>
            {hasContactData ? (
              <div className="space-y-3">
                {phoneEntries.map((phone: string, index: number) => (
                  <div key={`${phone}-${index}`}>
                    <a
                      data-testid={index === 0 ? 'listing-detail-phone-link' : undefined}
                      href={`tel:${phone}`}
                      className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors bg-primary text-white hover:bg-primary/90"
                    >
                      Nazovi
                    </a>
                    <p className="text-xs text-slate-500 mt-1">{phone}</p>
                  </div>
                ))}

                {listing.provider_profiles?.email && (
                  <div>
                    <a
                      data-testid="listing-detail-email-link"
                      href={`mailto:${listing.provider_profiles.email}`}
                      className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Pošalji email
                    </a>
                    <p className="text-xs text-slate-500 mt-1 break-all">{listing.provider_profiles.email}</p>
                  </div>
                )}

                {listing.provider_profiles?.website && (
                  <div>
                    <a
                      data-testid="listing-detail-website-link"
                      href={listing.provider_profiles.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Web stranica
                    </a>
                    <p className="text-xs text-slate-500 mt-1 break-all">{listing.provider_profiles.website}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Kontakt podaci nisu dostupni</p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Galerija</h2>
            <div className="aspect-video rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/70 flex items-center justify-center text-slate-500">
              <div className="text-center px-4">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <ImageOff className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Trenutno nema dodane fotografije</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/oglas/:slug" element={<ListingDetailPage />} />
      <Route path="/uvjeti-koristenja" element={<UvjetiKoristenja />} />
      <Route path="/politika-privatnosti" element={<PolitikaPrivatnosti />} />
      <Route path="/odricanje-odgovornosti" element={<OdricanjeOdgovornosti />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}
