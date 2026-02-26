import React from 'react';
import { getArticleBySlug } from './articles';

interface ArticlePageProps {
  slug: string;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ slug }) => {
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Članak nije pronađen</h1>
          <a href="/novosti" className="text-primary font-semibold hover:underline">
            Povratak na novosti
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <article className="max-w-4xl mx-auto px-4">
        <a href="/novosti" className="inline-block mb-6 text-sm font-semibold text-slate-600 hover:text-primary">
          ← Sve novosti
        </a>

        <img src={article.coverImage} alt={article.title} className="w-full rounded-3xl object-cover aspect-[16/8] mb-8" />

        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{article.category}</p>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">{article.title}</h1>
        <p className="text-slate-400 mb-8">{article.date}</p>

        <div
          className="bg-white rounded-3xl p-8 border border-slate-100 leading-8 text-slate-700 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-7 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>
    </main>
  );
};
