import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bookmark } from 'lucide-react';
import { ArticlePreview } from './constants';

interface ArticleSectionProps {
  articles: ArticlePreview[];
}

export const ArticleSection: React.FC<ArticleSectionProps> = ({ articles }) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Novosti i Savjeti</h2>
            <p className="text-slate-500 max-w-xl">
              Pratite najnovije promjene u zakonima, savjete stručnjaka i novosti iz svijeta medicinske njege.
            </p>
          </div>
          <button className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline">
            Vidi sve članke <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6 shadow-sm bg-gradient-to-br from-slate-100 to-slate-50" />

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                <span>/{article.slug}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span>5 min čitanja</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors leading-tight">
                {article.title}
              </h3>

              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{article.excerpt}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Pročitaj više{' '}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </span>
                <Bookmark className="w-4 h-4 text-slate-300 hover:text-primary transition-colors" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
