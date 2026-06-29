import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft } from 'lucide-react';
import { SEO } from '../components/SEO';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      const { data: articleData } = await supabase
        .from('content_items')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_active', true)
        .maybeSingle();

      if (articleData) {
        setArticle(articleData);

        const { data: blocksData } = await supabase
          .from('article_blocks')
          .select('*')
          .eq('content_item_id', articleData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        setBlocks(blocksData ?? []);
      }

      setLoading(false);
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-slate-500">Učitavanje...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div data-testid="article-not-found" className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg">Članak nije pronađen.</p>
        <Link to="/clanci" data-testid="article-not-found-back-link" className="text-primary hover:underline mt-4 inline-block">
          ← Povratak na članke
        </Link>
      </div>
    );
  }

  return (
    <article data-testid="article-detail-page" className="max-w-3xl mx-auto px-4 py-10">
      <SEO
        title={article.seo_title || article.title}
        description={article.seo_description || article.excerpt || ''}
        canonicalPath={`/clanak/${article.slug}`}
        ogImage={article.cover_image_url}
      />
      <Link
        to="/clanci"
        data-testid="article-back-link"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Svi članci
      </Link>

      {article.cover_image_url && (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-full h-64 md:h-80 object-cover rounded-2xl mb-8"
        />
      )}

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {article.category_key}
          </span>
        </div>
        <h1
          data-testid="article-detail-title"
          className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4"
        >
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-lg text-slate-500 leading-relaxed">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-4 text-sm text-slate-400 border-t border-slate-100 pt-4">
          {article.author_name && (
            <span className="font-medium text-slate-600">{article.author_name}</span>
          )}
          {article.published_at && (
            <span>{new Date(article.published_at).toLocaleDateString('hr-HR')}</span>
          )}
        </div>
      </header>

      {blocks.length > 0 ? (
        <div data-testid="article-content" className="space-y-6">
          {blocks.map((block) => {
            if (block.block_type === 'heading') {
              return (
                <h2 key={block.id} className="text-2xl font-bold text-slate-900 mt-8">
                  {block.text_content}
                </h2>
              );
            }
            if (block.block_type === 'text') {
              return (
                <p key={block.id} className="text-slate-700 leading-relaxed text-lg">
                  {block.text_content}
                </p>
              );
            }
            if (block.block_type === 'image') {
              return (
                <figure key={block.id} className="my-6">
                  <img
                    src={block.image_url}
                    alt={block.image_alt ?? ''}
                    className="w-full rounded-xl"
                    loading="lazy"
                  />
                  {block.caption && (
                    <figcaption className="text-sm text-slate-400 text-center mt-2">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return null;
          })}
        </div>
      ) : (
        article.description && (
          <div data-testid="article-content" className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
              {article.description}
            </p>
          </div>
        )
      )}
    </article>
  );
}
