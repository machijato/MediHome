export interface Provider {
  id: string;
  slug?: string | null;
  name: string;
  type: 'physio' | 'nurse' | 'equipment' | 'transport' | 'other';
  rating: number | null;
  reviewsCount: number;
  price: string;
  location: string;
  image: string;
  listing_images?: Array<{
    id?: string;
    image_url?: string | null;
    storage_path?: string | null;
    is_primary?: boolean | null;
    display_order?: number | null;
  }>;
  description: string;
  tags: string[];
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

export const CATEGORIES = [
  {
    id: 'physio',
    name: 'Fizioterapeuti',
    desc: 'Fizikalna terapija (terapija, masaža, vježba)',
    color: 'text-blue-600'
  },
  {
    id: 'nurse',
    name: 'Njega u kući',
    desc: 'Njega u kući (medicinske sestre, njega bolesnika)',
    color: 'text-emerald-600'
  },
  {
    id: 'equipment',
    name: 'Najam opreme',
    desc: 'Najam opreme (bolnička medicinska oprema i pomagala)',
    color: 'text-purple-600'
  },
  {
    id: 'transport',
    name: 'Sanitetski prijevoz',
    desc: 'Sanitetski prijevoz (prijevoz bolesnika i nepokretnih osoba)',
    color: 'text-red-600'
  }
];
