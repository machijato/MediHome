// Parametri filtera na početnoj stranici (sve se čuva u URL-u, pa se rezultati mogu dijeliti i osvježiti).
export const OPTION_GROUPS = [
  { key: 'work_type', param: 'tip', label: 'Tip rada' },
  { key: 'specialization', param: 'spec', label: 'Specijalizacija' },
  { key: 'therapy_methods', param: 'metoda', label: 'Metode terapije' },
] as const;

export const OPTION_FILTER_CATEGORY = 'fizioterapeut';

export const FILTER_PARAM_NAMES = ['q', 'cat', 'county', 'min', 'max', ...OPTION_GROUPS.map((g) => g.param), 'page'] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseIds(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(',').map((v) => v.trim()).filter((v) => UUID.test(v))));
}

export function parsePrice(value: string | null): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export type ListingFilters = {
  min: number | null;
  max: number | null;
  // parametar grupe (tip/spec/metoda) -> odabrani id-jevi opcija
  options: Record<string, string[]>;
};

export function readFilters(params: URLSearchParams): ListingFilters {
  return {
    min: parsePrice(params.get('min')),
    max: parsePrice(params.get('max')),
    options: Object.fromEntries(OPTION_GROUPS.map((g) => [g.param, parseIds(params.get(g.param))])),
  };
}

export function hasAdvancedFilters(f: ListingFilters): boolean {
  return f.min != null || f.max != null || Object.values(f.options).some((ids) => ids.length > 0);
}

export const CATEGORY_NAME_BY_SLUG: Record<string, string> = {
  fizioterapeut: 'Fizioterapeuti',
  'kucna-njega': 'Njega u kući',
  'najam-opreme': 'Najam opreme',
  'sanitetski-prijevoz': 'Sanitetski prijevoz',
};
