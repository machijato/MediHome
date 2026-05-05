const CROATIAN_CHAR_MAP: Record<string, string> = {
  č: 'c',
  ć: 'c',
  š: 's',
  ž: 'z',
  đ: 'd',
};

export const generateListingSlug = (title: string): string => {
  const normalized = title
    .toLowerCase()
    .replace(/[čćšžđ]/g, (char) => CROATIAN_CHAR_MAP[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = normalized || 'oglas';

  return `${base}-${Date.now()}`;
};
