import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, Route, Routes } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronDown, Activity, HeartPulse, Package, MapPin, PlusCircle, ArrowRight } from 'lucide-react';
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
  const [user, setUser] = useState<any>(null);
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);

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

  const handleCreateListing = (newListing: Provider) => {
    setProviders([newListing, ...providers]);
  };

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
                  <ListingCard key={provider.id} provider={provider} />
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
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Objavi svoj oglas besplatno
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
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/uvjeti-koristenja" element={<UvjetiKoristenja />} />
      <Route path="/politika-privatnosti" element={<PolitikaPrivatnosti />} />
      <Route path="/odricanje-odgovornosti" element={<OdricanjeOdgovornosti />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}
