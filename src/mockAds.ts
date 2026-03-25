export type AdPosition = 'top' | 'left' | 'right';

export interface HomepageAd {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  position: AdPosition;
  order: number;
  ctaLabel?: string;
  link?: string;
  variant?: 'default' | 'compact';
}

export const HOMEPAGE_ADS: HomepageAd[] = [
  {
    id: 'top-1',
    title: 'OVDJE MOŽE BITI VAŠ OGLAS',
    description: 'Istaknite svoju uslugu na vrhu MediHome naslovnice i privucite nove korisnike već danas.',
    isActive: true,
    position: 'top',
    order: 1,
    ctaLabel: 'Rezervirajte poziciju',
    variant: 'default',
  },
  {
    id: 'left-1',
    title: 'OVDJE MOŽE BITI VAŠ OGLAS',
    description: 'Vidljiva lijeva pozicija idealna je za lokalne ordinacije i kućnu njegu.',
    isActive: true,
    position: 'left',
    order: 1,
    ctaLabel: 'Saznajte više',
    variant: 'default',
  },
  {
    id: 'left-2',
    title: 'OVDJE MOŽE BITI VAŠ OGLAS',
    description: 'Dodatni prostor za sezonske kampanje ili posebne ponude.',
    isActive: true,
    position: 'left',
    order: 2,
    variant: 'compact',
  },
  {
    id: 'right-1',
    title: 'OVDJE MOŽE BITI VAŠ OGLAS',
    description: 'Premium desna pozicija ostaje u vidnom polju tijekom pregledavanja.',
    isActive: true,
    position: 'right',
    order: 1,
    ctaLabel: 'Kontaktirajte nas',
    variant: 'default',
  },
];

export const getActiveAdsByPosition = (ads: HomepageAd[], position: AdPosition) =>
  ads
    .filter((ad) => ad.isActive && ad.position === position)
    .sort((a, b) => a.order - b.order);
