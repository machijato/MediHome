import React from 'react';
import { LegalPageLayout } from '../layouts/LegalPageLayout';

export const DisclaimerPage: React.FC = () => {
  return (
    <LegalPageLayout
      title="Odricanje od odgovornosti"
      sections={[
        {
          title: 'Opće informacije',
          paragraphs: ['Ova platforma služi kao informativni servis koji povezuje korisnike s pružateljima zdravstvenih i pomoćnih usluga.'],
        },
        {
          title: 'Odgovornost za usluge',
          paragraphs: [
            'Platforma ne pruža zdravstvene usluge.',
            'Sve usluge pružaju neovisni pružatelji usluga koji su odgovorni za kvalitetu, sigurnost i zakonitost svojih usluga.',
          ],
        },
        {
          title: 'Točnost informacija',
          paragraphs: [
            'Platforma ne jamči potpunu točnost ili ažurnost informacija objavljenih u oglasima.',
            'Korisnici su odgovorni za provjeru informacija prije korištenja usluge.',
          ],
        },
        {
          title: 'Medicinski savjeti',
          paragraphs: ['Informacije dostupne na platformi ne predstavljaju medicinski savjet niti zamjenjuju stručni medicinski pregled ili terapiju.'],
        },
        {
          title: 'Korištenje platforme',
          paragraphs: [
            'Korisnici koriste platformu na vlastitu odgovornost.',
            'Platforma ne odgovara za eventualnu štetu nastalu korištenjem usluga objavljenih na platformi.',
          ],
        },
      ]}
    />
  );
};
