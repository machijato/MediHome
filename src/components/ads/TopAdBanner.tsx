import React from 'react';
import { HomepageAd } from '../../mockAds';
import { AdCard } from './AdCard';

interface TopAdBannerProps {
  ads: HomepageAd[];
}

export function TopAdBanner({ ads }: TopAdBannerProps) {
  if (ads.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-5">
      <div className="mx-auto max-w-7xl px-4">
        <div className="space-y-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} size="horizontal" />
          ))}
        </div>
      </div>
    </section>
  );
}
