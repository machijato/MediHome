import React from 'react';
import { LegalPageLayout } from '../layouts/LegalPageLayout';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalPageLayout
      title="Politika privatnosti"
      sections={[
        {
          title: 'Uvod',
          paragraphs: [
            'Ova politika privatnosti objašnjava na koji način platforma prikuplja, koristi i štiti osobne podatke korisnika.',
            'Korištenjem ove web stranice korisnik pristaje na obradu osobnih podataka u skladu s ovom politikom.',
          ],
        },
        {
          title: 'Koje podatke prikupljamo',
          paragraphs: ['Platforma može prikupljati sljedeće podatke:'],
          listItems: [
            'ime i prezime',
            'kontakt telefon',
            'email adresu',
            'lokaciju pružanja usluge',
            'opis usluge',
            'ostale podatke koje korisnik dobrovoljno unese prilikom objave oglasa.',
          ],
        },
        {
          title: 'Svrha prikupljanja podataka',
          paragraphs: ['Podaci se prikupljaju radi:'],
          listItems: [
            'objave i prikaza oglasa na platformi',
            'omogućavanja komunikacije između korisnika',
            'poboljšanja funkcionalnosti platforme',
            'administracije i sigurnosti sustava.',
          ],
        },
        {
          title: 'Dijeljenje podataka',
          paragraphs: [
            'Platforma ne prodaje osobne podatke trećim stranama.',
            'Podaci mogu biti dostupni drugim korisnicima samo u onoj mjeri u kojoj ih pružatelj usluge javno objavi u svom oglasu.',
          ],
        },
        {
          title: 'Sigurnost podataka',
          paragraphs: ['Platforma koristi tehničke i organizacijske mjere kako bi zaštitila osobne podatke korisnika.'],
        },
        {
          title: 'Prava korisnika',
          paragraphs: ['Korisnici imaju pravo:'],
          listItems: [
            'zatražiti pristup svojim podacima',
            'zatražiti ispravak podataka',
            'zatražiti brisanje podataka',
            'ograničiti obradu podataka.',
          ],
        },
        {
          title: 'Kontakt',
          paragraphs: ['Za pitanja vezana uz zaštitu podataka korisnici se mogu obratiti administratoru platforme.'],
        },
      ]}
    />
  );
};
