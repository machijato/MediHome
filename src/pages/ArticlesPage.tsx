import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from('content_items')
        .select('id, title, slug, excerpt, cover_image_url, category_key, author_name, published_at, created_at')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('published_at', { ascending: false });
      setArticles(data ?? []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  return (
    <div data-testid="articles-page" className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Članci i savjeti</h1>
        <p className="text-slate-500 mt-2">Korisni savjeti o zdravlju, rehabilitaciji i njezi</p>
      </div>

      {loading && <p className="text-slate-500">Učitavanje...</p>}

      {!loading && articles.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Trenutno nema objavljenih članaka.</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/clanak/${article.slug}`}
              data-testid="article-card"
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {article.cover_image_url && (
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              )}
              {!article.cover_image_url && (
                <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {article.category_key}
                  </span>
                </div>
                <h2 className="font-bold text-slate-900 text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                  {article.author_name && <span>{article.author_name}</span>}
                  {article.author_name && article.published_at && <span>·</span>}
                  {article.published_at && (
                    <span>{new Date(article.published_at).toLocaleDateString('hr-HR')}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
