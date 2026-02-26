import React from 'react';
import { ARTICLES } from './articles';

export const NewsListPage = () => {
  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-primary font-bold">MediHome</p>
            <h1 className="text-4xl font-extrabold text-slate-900">Novosti i savjeti</h1>
          </div>
          <a href="/" className="text-sm font-semibold text-slate-600 hover:text-primary">← Povratak na početnu</a>
        </div>

        <div className="space-y-6">
          {ARTICLES.map((article) => (
            <a
              key={article.slug}
              href={`/novosti/${article.slug}`}
              className="block bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all"
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{article.category}</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{article.title}</h2>
              <p className="text-sm text-slate-400 mb-4">{article.date}</p>
              <p className="text-slate-600">{article.excerpt}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
};
