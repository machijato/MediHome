import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ListingCardProps {
  listing: {
    title: string;
    description: string;
    display_name: string;
    city: string;
  };
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 card-hover group"
    >
      <div className="h-48 bg-gradient-to-br from-primary/10 via-white to-secondary/10" />

      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{listing.title}</h3>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{listing.description}</p>

        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <div className="font-semibold text-slate-600">{listing.display_name}</div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Pogledaj detalje <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
