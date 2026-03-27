import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from './lib/supabase';

interface CategorySectionProps {
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const CATEGORY_IMAGES: Record<string, string> = {
  physio: 'https://picsum.photos/seed/physio_cat/800/600',
  nurse: 'https://picsum.photos/seed/nurse_cat/800/600',
  equipment: 'https://picsum.photos/seed/equip_cat/800/600',
  transport: 'https://picsum.photos/seed/transport_cat/800/600',
};

export const CategorySection: React.FC<CategorySectionProps> = ({ activeCategory, setActiveCategory }) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data ?? []);
      }

      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Istražite kategorije</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Odaberite područje koje vas zanima kako biste vidjeli dostupne stručnjake i opremu.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Učitavanje...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const image = CATEGORY_IMAGES[category.slug] ?? 'https://picsum.photos/seed/default_cat/800/600';
              const categoryId = category.slug;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(categoryId)}
                  className={`flex flex-col group rounded-3xl overflow-hidden border-2 transition-all text-left bg-white ${
                    activeCategory === categoryId
                      ? 'border-primary shadow-xl scale-[1.02]'
                      : 'border-transparent shadow-md hover:border-slate-200'
                  }`}
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3
                      className={`text-lg font-bold mb-1 transition-colors ${
                        activeCategory === categoryId ? 'text-primary' : 'text-slate-900'
                      }`}
                    >
                      {category.name}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-3">{category.description}</p>

                    <div className="mt-auto flex items-center gap-2 text-primary font-bold text-xs">
                      <span>Pregledaj</span>
                      <Search className="w-3 h-3" />
                    </div>
                  </div>

                  {activeCategory === categoryId && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                      <Search className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
