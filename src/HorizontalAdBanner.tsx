import React from 'react';

type HorizontalAdBannerProps = {
  className?: string;
};

export function HorizontalAdBanner({ className = '' }: HorizontalAdBannerProps) {
  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 via-white to-slate-100 px-6 py-6 shadow-sm md:px-10 md:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.08),transparent_55%,rgba(124,58,237,0.08))]" />
          <div className="relative flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 py-6 text-center md:py-8">
            <span className="text-sm font-extrabold tracking-[0.2em] text-slate-500 md:text-base">
              OVDJE MOŽE BITI VAŠ OGLAS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
