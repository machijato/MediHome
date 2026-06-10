import React from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { CATEGORIES } from './constants';

interface CategorySectionProps {
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

const CATEGORY_SLUG_BY_ID: Record<string, string> = {
  physio: 'fizioterapeut',
  nurse: 'kucna-njega',
  equipment: 'najam-opreme',
  transport: 'sanitetski-prijevoz',
};

export const CategorySection: React.FC<CategorySectionProps> = ({ activeCategory, setActiveCategory }) => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Istražite kategorije</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Odaberite područje koje vas zanima kako biste vidjeli dostupne stručnjake i opremu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const categorySlug = CATEGORY_SLUG_BY_ID[cat.id] ?? cat.id;
            const isActive = activeCategory === categorySlug;

            return (
            <button
              key={cat.id}
              data-testid={`category-filter-${categorySlug}`}
              onClick={() => setActiveCategory(categorySlug)}
              className={`flex flex-col group rounded-3xl overflow-hidden border-2 transition-all text-left bg-white ${
                isActive
                  ? 'border-primary shadow-xl scale-[1.02]'
                  : 'border-transparent shadow-md hover:border-slate-200'
              }`}
            >
              <div className="relative h-40 w-full overflow-hidden">
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className={`text-lg font-bold mb-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-900'
                }`}>
                  {cat.name}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-3">
                  {cat.desc}
                </p>
                
                <div className="mt-auto flex items-center gap-2 text-primary font-bold text-xs">
                  <span>Pregledaj</span>
                  <Search className="w-3 h-3" />
                </div>
              </div>
              
              {isActive && (
                <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                  <Search className="w-3 h-3" />
                </div>
              )}
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
