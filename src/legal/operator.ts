import { ADMIN_CONTACT_EMAIL } from '../lib/contact';

// NACRT: dok je LEGAL_DRAFT = true, svaka pravna stranica prikazuje oznaku "nacrt". Prije puštanja uživo:
// 1) pravnik pregleda tekstove, 2) upisati podatke o vlasniku stranice ispod, 3) postaviti LEGAL_DRAFT na false.
export const LEGAL_DRAFT = true;
export const LEGAL_UPDATED = '21. listopada 2026.';

export const OPERATOR = {
  name: '', // Naziv/tvrtka ili ime i prezime vlasnika stranice
  address: '', // Sjedište / adresa
  oib: '',
  registry: '', // Za tvrtke: upis u sudski registar, MBS; za obrt: upis u obrtni registar
  phone: '',
  email: ADMIN_CONTACT_EMAIL,
};

export const SERVICE_NAME = 'MediHome';

export function operatorValue(value: string, label: string): string {
  return value.trim() !== '' ? value : `[${label}: dopuniti]`;
}
