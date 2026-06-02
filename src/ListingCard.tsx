import React from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Provider } from './constants';

interface ListingCardProps {
  provider: Provider;
}

export const ListingCard: React.FC<ListingCardProps> = ({ provider }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 card-hover group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          data-testid="listing-card-image"
          src={provider.image}
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-primary shadow-sm">
          {provider.price}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900">{provider.name}</h3>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold">{provider.rating}</span>
            <span className="text-xs text-slate-400 font-normal">({provider.reviewsCount})</span>
          </div>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
          {provider.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {provider.location}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Dostupno odmah
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {provider.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] uppercase tracking-wider font-bold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
