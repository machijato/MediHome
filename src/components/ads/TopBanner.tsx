import React from 'react';

type TopBannerProps = {
  isActive: boolean;
};

export function TopBanner({ isActive }: TopBannerProps) {
  if (!isActive) {
    return null;
  }

  return (
    <section className="top-banner" aria-label="Promotivni banner">
      <div className="top-banner__content">TOP BANNER OGLAS (728 x 90 / 970 x 120)</div>
    </section>
  );
}
