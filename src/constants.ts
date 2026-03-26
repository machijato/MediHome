export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  desc: string;
  image: string;
  color: string;
}

export interface ProviderListingCardData {
  id: string;
  title: string;
  description: string;
  display_name: string;
  city: string;
  category: Pick<ServiceCategory, 'id' | 'name' | 'slug'>;
}

export interface ArticlePreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
}

export const ZUPANIJE = [
  'Bjelovarsko-bilogorska',
  'Brodsko-posavska',
  'Dubrovačko-neretvanska',
  'Istarska',
  'Karlovačka',
  'Koprivničko-križevačka',
  'Krapinsko-zagorska',
  'Ličko-senjska',
  'Međimurska',
  'Osječko-baranjska',
  'Požeško-slavonska',
  'Primorsko-goranska',
  'Sisačko-moslavačka',
  'Splitsko-dalmatinska',
  'Šibensko-kninska',
  'Varaždinska',
  'Virovitičko-podravska',
  'Vukovarsko-srijemska',
  'Zadarska',
  'Zagrebačka',
  'Grad Zagreb'
].sort();

export const TEMP_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'temp-1',
    name: 'Fizioterapeut',
    slug: 'fizioterapeut',
    desc: 'Fizikalna terapija, masaža i rehabilitacija kod kuće.',
    image: 'https://picsum.photos/seed/fizioterapeut/800/600',
    color: 'text-blue-600'
  },
  {
    id: 'temp-2',
    name: 'Kućna njega',
    slug: 'kucna-njega',
    desc: 'Medicinska i pomoćna njega za starije i nemoćne osobe.',
    image: 'https://picsum.photos/seed/kucna-njega/800/600',
    color: 'text-emerald-600'
  },
  {
    id: 'temp-3',
    name: 'Najam opreme',
    slug: 'najam-opreme',
    desc: 'Najam medicinske opreme i pomagala za kućnu uporabu.',
    image: 'https://picsum.photos/seed/najam-opreme/800/600',
    color: 'text-purple-600'
  },
  {
    id: 'temp-4',
    name: 'Sanitetski prijevoz',
    slug: 'sanitetski-prijevoz',
    desc: 'Siguran prijevoz pacijenata i nepokretnih osoba.',
    image: 'https://picsum.photos/seed/sanitetski-prijevoz/800/600',
    color: 'text-red-600'
  }
];

export const TEMP_PROVIDER_LISTINGS: ProviderListingCardData[] = [];

export const TEMP_ARTICLES: ArticlePreview[] = [];
