import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AdminPageProps {
  user: any;
}

type AdminTab = 'dashboard' | 'listings' | 'users' | 'articles';
type ListingFilter = 'all' | 'pending' | 'approved' | 'draft';

const articleFormInitialState = {
  title: '',
  excerpt: '',
  description: '',
  category_key: 'zdravlje',
  author_name: '',
  seo_title: '',
  seo_description: '',
};

export function AdminPage({ user }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <main data-testid="admin-page" className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin panel</h1>
        <span className="text-sm text-slate-500">Prijavljeni kao admin{user?.email ? `: ${user.email}` : ''}</span>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
        {[
          { key: 'dashboard', label: 'Pregled', testid: 'admin-tab-dashboard' },
          { key: 'listings', label: 'Oglasi', testid: 'admin-tab-listings' },
          { key: 'users', label: 'Korisnici', testid: 'admin-tab-users' },
          { key: 'articles', label: 'Članci', testid: 'admin-tab-articles' },
        ].map((tab) => (
          <button
            key={tab.key}
            data-testid={tab.testid}
            onClick={() => setActiveTab(tab.key as AdminTab)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'listings' && <AdminListings />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'articles' && <AdminArticles />}
    </main>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    totalUsers: 0,
    newUsersLast30: 0,
    totalArticles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [
        { count: total },
        { count: pending },
        { count: approved },
        { count: totalProfiles },
        { count: newProfiles },
        { count: articles },
      ] = await Promise.all([
        supabase.from('provider_listings').select('*', { count: 'exact', head: true }),
        supabase.from('provider_listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('provider_listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('provider_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('provider_profiles').select('*', { count: 'exact', head: true }).gte('created_at', last30Days),
        supabase.from('content_items').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalListings: total ?? 0,
        pendingListings: pending ?? 0,
        approvedListings: approved ?? 0,
        totalUsers: totalProfiles ?? 0,
        newUsersLast30: newProfiles ?? 0,
        totalArticles: articles ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Ukupno oglasa', value: stats.totalListings, testid: 'stat-total-listings' },
    { label: 'Na pregledu', value: stats.pendingListings, testid: 'stat-pending-listings' },
    { label: 'Aktivnih oglasa', value: stats.approvedListings, testid: 'stat-approved-listings' },
    { label: 'Ukupno korisnika', value: stats.totalUsers, testid: 'stat-total-users' },
    { label: 'Novi korisnici (30 dana)', value: stats.newUsersLast30, testid: 'stat-new-users' },
    { label: 'Ukupno članaka', value: stats.totalArticles, testid: 'stat-total-articles' },
  ];

  if (loading) return <p>Učitavanje statistika...</p>;

  return (
    <div data-testid="admin-dashboard">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Statistike stranice</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.testid}
            data-testid={card.testid}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <p className="text-sm text-slate-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [filter, setFilter] = useState<ListingFilter>('pending');
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('provider_listings')
      .select('id, slug, title, status, city, price_from, price_unit, created_at, provider_profiles(display_name, email)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('status', filter);

    const { data } = await query;
    setListings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const handleApprove = async (id: string) => {
    await supabase.from('provider_listings').update({ status: 'approved' }).eq('id', id);
    setListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, status: 'approved' } : listing)));
  };

  const handleReject = async (id: string) => {
    await supabase.from('provider_listings').update({ status: 'rejected' }).eq('id', id);
    setListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, status: 'rejected' } : listing)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigurno želite obrisati ovaj oglas?')) return;
    await supabase.from('listing_images').delete().eq('listing_id', id);
    await supabase.from('listing_selected_options').delete().eq('listing_id', id);
    await supabase.from('provider_listings').delete().eq('id', id);
    setListings((prev) => prev.filter((listing) => listing.id !== id));
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from('provider_listings').update({ status: 'draft' }).eq('id', id);
    setListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, status: 'draft' } : listing)));
  };

  return (
    <div data-testid="admin-listings">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Upravljanje oglasima</h2>
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map((filterValue) => (
            <button
              key={filterValue}
              data-testid={`filter-${filterValue}`}
              onClick={() => setFilter(filterValue)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === filterValue ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterValue === 'pending' ? 'Na pregledu' : filterValue === 'approved' ? 'Aktivni' : 'Svi'}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Učitavanje...</p>}

      {!loading && listings.length === 0 && <p className="text-slate-500">Nema oglasa u ovoj kategoriji.</p>}

      <div className="space-y-3">
        {listings.map((listing) => (
          <div key={listing.id} data-testid="admin-listing-item" className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    listing.status === 'approved' ? 'bg-green-100 text-green-700' :
                    listing.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    listing.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-500'
                  }`}
                  >
                    {listing.status === 'approved' ? 'Aktivno' :
                      listing.status === 'pending' ? 'Na pregledu' :
                        listing.status === 'rejected' ? 'Odbijeno' : 'Neaktivno'}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 truncate">{listing.title}</p>
                <p className="text-sm text-slate-500">
                  {listing.city} · {listing.price_from} {listing.price_unit} ·{' '}
                  {listing.provider_profiles?.display_name ?? 'Nepoznat korisnik'}
                </p>
                <p className="text-xs text-slate-400 mt-1">{new Date(listing.created_at).toLocaleDateString('hr-HR')}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                {listing.slug && listing.status === 'approved' && (
                  <Link
                    to={`/oglas/${listing.slug}`}
                    target="_blank"
                    data-testid="admin-listing-preview-link"
                    className="text-xs text-primary hover:underline px-2 py-1"
                  >
                    Pregledaj
                  </Link>
                )}
                {listing.status === 'pending' && (
                  <>
                    <button
                      data-testid="admin-approve-button"
                      onClick={() => handleApprove(listing.id)}
                      className="text-xs font-semibold px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Odobri
                    </button>
                    <button
                      data-testid="admin-reject-button"
                      onClick={() => handleReject(listing.id)}
                      className="text-xs font-semibold px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Odbij
                    </button>
                  </>
                )}
                {listing.status === 'approved' && (
                  <button
                    data-testid="admin-deactivate-button"
                    onClick={() => handleDeactivate(listing.id)}
                    className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Deaktiviraj
                  </button>
                )}
                <button
                  data-testid="admin-delete-button"
                  onClick={() => handleDelete(listing.id)}
                  className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Obriši
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('id, user_id, display_name, email, status, is_public, is_admin, created_at, provider_listings(count)')
        .order('created_at', { ascending: false });
      setUsers(data ?? []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleBan = async (id: string) => {
    await supabase.from('provider_profiles').update({ status: 'banned', is_public: false }).eq('id', id);
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status: 'banned', is_public: false } : user)));
  };

  const handleUnban = async (id: string) => {
    await supabase.from('provider_profiles').update({ status: 'active', is_public: true }).eq('id', id);
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status: 'active', is_public: true } : user)));
  };

  return (
    <div data-testid="admin-users">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Upravljanje korisnicima</h2>

      {loading && <p>Učitavanje...</p>}

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            data-testid="admin-user-item"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {user.is_admin && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Admin</span>
                )}
                {user.status === 'banned' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Baniran</span>
                )}
              </div>
              <p className="font-semibold text-slate-900">{user.display_name ?? 'Bez imena'}</p>
              <p className="text-sm text-slate-500">{user.email ?? '—'}</p>
              <p className="text-xs text-slate-400">Registriran: {new Date(user.created_at).toLocaleDateString('hr-HR')}</p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {!user.is_admin && user.status !== 'banned' && (
                <button
                  data-testid="admin-ban-button"
                  onClick={() => handleBan(user.id)}
                  className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Baniraj
                </button>
              )}
              {user.status === 'banned' && (
                <button
                  data-testid="admin-unban-button"
                  onClick={() => handleUnban(user.id)}
                  className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Odbaniraj
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(articleFormInitialState);
  const [saving, setSaving] = useState(false);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('content_items')
      .select('id, title, status, is_active, category_key, published_at, created_at')
      .order('created_at', { ascending: false });
    setArticles(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[šđ]/g, 's')
      .replace(/ž/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handlePublish = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);

    const slug = `${generateSlug(formData.title)}-${Date.now()}`;

    const { error } = await supabase.from('content_items').insert({
      type: 'article',
      category_key: formData.category_key,
      title: formData.title,
      slug,
      excerpt: formData.excerpt,
      description: formData.description,
      author_name: formData.author_name,
      status: 'published',
      is_active: true,
      published_at: new Date().toISOString(),
      seo_title: formData.seo_title || formData.title,
      seo_description: formData.seo_description || formData.excerpt,
    });

    setSaving(false);

    if (!error) {
      setShowForm(false);
      setFormData(articleFormInitialState);
      fetchArticles();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('content_items').update({ is_active: !current }).eq('id', id);
    setArticles((prev) => prev.map((article) => (article.id === id ? { ...article, is_active: !current } : article)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigurno želite obrisati ovaj članak?')) return;
    await supabase.from('content_items').delete().eq('id', id);
    setArticles((prev) => prev.filter((article) => article.id !== id));
  };

  return (
    <div data-testid="admin-articles">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Upravljanje člancima</h2>
        <button
          data-testid="admin-new-article-button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          {showForm ? 'Odustani' : '+ Novi članak'}
        </button>
      </div>

      {showForm && (
        <div data-testid="admin-article-form" className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Novi članak</h3>
          {[
            { key: 'title', label: 'Naslov *', type: 'text', testid: 'article-input-title' },
            { key: 'excerpt', label: 'Sažetak', type: 'text', testid: 'article-input-excerpt' },
            { key: 'author_name', label: 'Autor', type: 'text', testid: 'article-input-author' },
            { key: 'seo_title', label: 'SEO naslov', type: 'text', testid: 'article-input-seo-title' },
            { key: 'seo_description', label: 'SEO opis', type: 'text', testid: 'article-input-seo-desc' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              <input
                data-testid={field.testid}
                type={field.type}
                value={formData[field.key as keyof typeof formData]}
                onChange={(event) => setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sadržaj</label>
            <textarea
              data-testid="article-input-description"
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategorija</label>
            <select
              data-testid="article-input-category"
              value={formData.category_key}
              onChange={(event) => setFormData((prev) => ({ ...prev, category_key: event.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="zdravlje">Zdravlje</option>
              <option value="njega">Njega</option>
              <option value="rehabilitacija">Rehabilitacija</option>
              <option value="vijesti">Vijesti</option>
            </select>
          </div>
          <button
            data-testid="article-publish-button"
            onClick={handlePublish}
            disabled={saving || !formData.title.trim()}
            className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Objavljivanje...' : 'Objavi članak'}
          </button>
        </div>
      )}

      {loading && <p>Učitavanje...</p>}

      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            data-testid="admin-article-item"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  article.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}
                >
                  {article.is_active ? 'Aktivno' : 'Neaktivno'}
                </span>
                <span className="text-xs text-slate-400">{article.category_key}</span>
              </div>
              <p className="font-semibold text-slate-900 truncate">{article.title}</p>
              <p className="text-xs text-slate-400">{new Date(article.created_at).toLocaleDateString('hr-HR')}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                data-testid="admin-article-toggle-button"
                onClick={() => handleToggleActive(article.id, article.is_active)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {article.is_active ? 'Deaktiviraj' : 'Aktiviraj'}
              </button>
              <button
                data-testid="admin-article-delete-button"
                onClick={() => handleDelete(article.id)}
                className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Obriši
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
