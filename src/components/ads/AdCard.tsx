import React from 'react';
import { Megaphone } from 'lucide-react';
import { HomepageAd } from '../../mockAds';

interface AdCardProps {
  ad: HomepageAd;
  size?: 'horizontal' | 'vertical';
}

export function AdCard({ ad, size = 'vertical' }: AdCardProps) {
  const isHorizontal = size === 'horizontal';

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-primary/[0.03] to-secondary/[0.05] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 ${
        isHorizontal ? 'md:px-8 md:py-6' : ''
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-12 h-28 w-28 rounded-full bg-secondary/10 blur-2xl" />

      <div className={`relative z-10 ${isHorizontal ? 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between' : ''}`}>
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            <Megaphone className="h-3.5 w-3.5" />
            PROMO OGLAS
          </p>
          <h3 className="text-lg font-extrabold leading-tight text-slate-900">{ad.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{ad.description}</p>
        </div>

        {ad.ctaLabel && (
          <button className="mt-4 inline-flex w-fit rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 md:mt-0">
            {ad.ctaLabel}
          </button>
        )}
      </div>
    </article>
  );
}
