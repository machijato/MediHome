// Baza blokiranom korisniku odbija svaku radnju pisanja greškom 42501 s porukom o blokadi.
export function isBlockedError(error: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(error && error.code === '42501' && /blokiran/i.test(error.message ?? ''));
}

export const BLOCKED_ERROR_MESSAGE = 'Vaš račun je blokiran. Za odblokiranje obratite se administratoru.';
