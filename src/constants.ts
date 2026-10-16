export interface Provider {
  id: string;
  slug?: string | null;
  name: string;
  type: 'physio' | 'nurse' | 'equipment' | 'transport' | 'other';
  rating: number;
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

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: 'Zakon' | 'Savjeti' | 'Novosti';
  date: string;
  image: string;
  isPaid?: boolean;
}

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Novi pravilnik o kućnoj njezi u 2024.',
    excerpt: 'Saznajte koje su ključne promjene u zakonskom okviru za pružatelje usluga njege u kući.',
    category: 'Zakon',
    date: '24. Veljače 2024.',
    image: 'https://picsum.photos/seed/legal/800/600'
  },
  {
    id: '2',
    title: '5 vježbi za oporavak koljena kod kuće',
    excerpt: 'Stručni savjeti naših fizioterapeuta za brži oporavak nakon ozljede ligamenta.',
    category: 'Savjeti',
    date: '20. Veljače 2024.',
    image: 'https://picsum.photos/seed/rehab/800/600',
    isPaid: true
  },
  {
    id: '3',
    title: 'Kako odabrati pravi bolnički krevet?',
    excerpt: 'Vodič kroz najvažnije funkcije i modele medicinskih kreveta za kućnu upotrebu.',
    category: 'Savjeti',
    date: '15. Veljače 2024.',
    image: 'https://picsum.photos/seed/bed/800/600'
  }
];

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
    image: 'https://picsum.photos/seed/physio_cat/800/600',
    color: 'text-blue-600'
  },
  {
    id: 'nurse',
    name: 'Njega u kući',
    desc: 'Njega u kući (medicinske sestre, njega bolesnika)',
    image: 'https://picsum.photos/seed/nurse_cat/800/600',
    color: 'text-emerald-600'
  },
  {
    id: 'equipment',
    name: 'Najam opreme',
    desc: 'Najam opreme (bolnička medicinska oprema i pomagala)',
    image: 'https://picsum.photos/seed/equip_cat/800/600',
    color: 'text-purple-600'
  },
  {
    id: 'transport',
    name: 'Sanitetski prijevoz',
    desc: 'Sanitetski prijevoz (prijevoz bolesnika i nepokretnih osoba)',
    image: 'https://picsum.photos/seed/transport_cat/800/600',
    color: 'text-red-600'
  }
];
