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

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Ivan Horvat',
    type: 'physio',
    rating: 4.9,
    reviewsCount: 124,
    price: '30€/h',
    location: 'Grad Zagreb',
    image: 'https://picsum.photos/seed/physio1/400/300',
    description: 'Specijalist za sportsku rehabilitaciju i oporavak nakon operacija.',
    tags: ['Rehabilitacija', 'Masaža', 'Sport']
  },
  {
    id: '2',
    name: 'Marija Kovač',
    type: 'nurse',
    rating: 4.8,
    reviewsCount: 89,
    price: '20€/h',
    location: 'Splitsko-dalmatinska',
    image: 'https://picsum.photos/seed/nurse1/400/300',
    description: 'Medicinska sestra s 10 godina iskustva u njezi starijih osoba.',
    tags: ['Njega', 'Injekcije', '24/7']
  },
  {
    id: '3',
    name: 'MedRent d.o.o.',
    type: 'equipment',
    rating: 4.7,
    reviewsCount: 45,
    price: 'od 5€/dan',
    location: 'Primorsko-goranska',
    image: 'https://picsum.photos/seed/equip1/400/300',
    description: 'Najam bolničkih kreveta, invalidskih kolica i koncentratora kisika.',
    tags: ['Najam', 'Dostava', 'Servis']
  },
  {
    id: '4',
    name: 'Ana Brkić',
    type: 'nurse',
    rating: 5.0,
    reviewsCount: 56,
    price: '25€/h',
    location: 'Osječko-baranjska',
    image: 'https://picsum.photos/seed/nurse2/400/300',
    description: 'Pomoć u kući i pratnja liječniku za starije i nemoćne.',
    tags: ['Pratnja', 'Domaćinstvo']
  },
  {
    id: '5',
    name: 'FizioCentar',
    type: 'physio',
    rating: 4.6,
    reviewsCount: 210,
    price: '35€/h',
    location: 'Zadarska',
    image: 'https://picsum.photos/seed/physio2/400/300',
    description: 'Grupne i individualne vježbe za kralježnicu u vašem domu.',
    tags: ['Kralježnica', 'Vježbe']
  },
  {
    id: '6',
    name: 'Ljekarna Plus',
    type: 'other',
    rating: 4.5,
    reviewsCount: 32,
    price: 'Prodaja',
    location: 'Grad Zagreb',
    image: 'https://picsum.photos/seed/shop1/400/300',
    description: 'Širok asortiman ortopedskih pomagala i medicinske kozmetike.',
    tags: ['Prodaja', 'Savjetovanje']
  },
  {
    id: '7',
    name: 'Sanitet Trans',
    type: 'transport',
    rating: 4.9,
    reviewsCount: 18,
    price: 'Po dogovoru',
    location: 'Grad Zagreb',
    image: 'https://picsum.photos/seed/ambulance/400/300',
    description: 'Profesionalni sanitetski prijevoz bolesnika u zemlji i inozemstvu.',
    tags: ['Prijevoz', 'Sanitet', '24/7']
  }
];
