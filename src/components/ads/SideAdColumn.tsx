import React from 'react';
import { HomepageAd } from '../../mockAds';
import { AdCard } from './AdCard';

interface SideAdColumnProps {
  ads: HomepageAd[];
}

export function SideAdColumn({ ads }: SideAdColumnProps) {
  if (ads.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24 space-y-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
