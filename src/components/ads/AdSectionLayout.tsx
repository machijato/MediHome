import React, { ReactNode } from 'react';
import { HomepageAd } from '../../mockAds';
import { SideAdColumn } from './SideAdColumn';

interface AdSectionLayoutProps {
  leftAds: HomepageAd[];
  rightAds: HomepageAd[];
  children: ReactNode;
}

export function AdSectionLayout({ leftAds, rightAds, children }: AdSectionLayoutProps) {
  const hasLeftAds = leftAds.length > 0;
  const hasRightAds = rightAds.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 xl:px-6">
      <div className="flex items-start gap-6">
        {hasLeftAds && (
          <aside className="hidden w-64 shrink-0 xl:block" aria-label="Lijevi oglasni prostor">
            <SideAdColumn ads={leftAds} />
          </aside>
        )}

        <div className="min-w-0 flex-1">{children}</div>

        {hasRightAds && (
          <aside className="hidden w-64 shrink-0 xl:block" aria-label="Desni oglasni prostor">
            <SideAdColumn ads={rightAds} />
          </aside>
        )}
      </div>
    </div>
  );
}
