import React from 'react';

type AdBannerSize = 'medium' | 'large';

interface AdBannerProps {
  size?: AdBannerSize;
  className?: string;
}

const sizeClasses: Record<AdBannerSize, string> = {
  medium: 'min-h-[120px] md:min-h-[130px]',
  large: 'min-h-[220px] md:min-h-[260px]',
};

export function AdBanner({ size = 'large', className = '' }: AdBannerProps) {
  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4">
        <div
          className={`w-full rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/10 via-white to-secondary/10 shadow-sm ${sizeClasses[size]}`}
        >
          <div className="h-full flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-[11px] tracking-[0.22em] font-bold uppercase text-slate-500 mb-2">Reklamni prostor</p>
              <p className="text-lg md:text-2xl font-extrabold text-slate-700">OVDJE MOŽE BITI VAŠ OGLAS</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
