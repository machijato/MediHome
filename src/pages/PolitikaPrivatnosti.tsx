import { Link } from 'react-router-dom';
import { LegalPage, LegalSection, MailLink, P, UL } from '../legal/LegalPage';
import { OPERATOR, SERVICE_NAME, operatorValue } from '../legal/operator';

export const PolitikaPrivatnosti = () => {
  return (
    <LegalPage
      title="Politika privatnosti"
      description="Koje osobne podatke MediHome prikuplja, zašto, koliko dugo ih čuva i koja prava imate (GDPR)."
      path="/politika-privatnosti"
    >
      <LegalSection title="1. Voditelj obrade">
        <P>
          Voditelj obrade osobnih podataka je {operatorValue(OPERATOR.name, 'naziv vlasnika stranice')}, {operatorValue(OPERATOR.address, 'adresa')},
          OIB: {operatorValue(OPERATOR.oib, 'OIB')}. Kontakt za pitanja o zaštiti podataka: <MailLink email={OPERATOR.email} subject="Zaštita osobnih podataka" />.
        </P>
      </LegalSection>

      <LegalSection title="2. Koje podatke obrađujemo i zašto">
        <UL
          items={[
            <><strong>Korisnički račun:</strong> e-mail adresa, lozinka (pohranjuje se samo u zaštićenom, nepovratnom obliku) i ime koje ste unijeli pri registraciji. Svrha: otvaranje i upravljanje računom, prijava, oporavak lozinke. Pravna osnova: izvršenje ugovora (uvjeti korištenja).</>,
            <><strong>Profil pružatelja:</strong> naziv ili ime, kontakt telefon, e-mail, web stranica, grad/županija. Svrha: prikaz profila i kontakt s korisnicima. Pravna osnova: izvršenje ugovora; kontakt podatke koje sami objavite prikazujemo javno.</>,
            <><strong>Oglasi:</strong> tekst, cijene, lokacija, odabrane opcije i slike. Svrha: objava i prikaz oglasa. Pravna osnova: izvršenje ugovora.</>,
            <><strong>Recenzije:</strong> ocjene, komentar, mjesec korištenja usluge i prikazano ime (ime i početno slovo prezimena). Svrha: objava korisničkih iskustava i moderiranje. Pravna osnova: legitimni interes (transparentnost i povjerenje u imenik) i izvršenje ugovora.</>,
            <><strong>Prijave sadržaja:</strong> razlog i napomena koje unesete kad prijavite recenziju ili oglas. Svrha: moderiranje i zaštita korisnika. Pravna osnova: legitimni interes i pravna obveza.</>,
            <><strong>Tehnički podaci:</strong> IP adresa i zapisi poslužitelja koje bilježe naši pružatelji hostinga radi sigurnosti i rada usluge. Pravna osnova: legitimni interes (sigurnost).</>,
            <><strong>Poruke koje nam pošaljete e-mailom</strong> (npr. zahtjev za odblokiranje) čuvamo koliko je potrebno za odgovor. Pravna osnova: legitimni interes / izvršenje ugovora.</>,
          ]}
        />
        <P>Ne koristimo analitiku ni oglašivačke alate, ne prodajemo podatke i ne provodimo automatizirano donošenje odluka ni profiliranje.</P>
      </LegalSection>

      <LegalSection title="3. Primatelji podataka i izvršitelji obrade">
        <UL
          items={[
            'Supabase (baza podataka, prijava i pohrana slika), poslužitelji u Europskoj uniji (Frankfurt, Njemačka);',
            'Vercel (hosting aplikacije);',
            'pružatelj e-pošte za slanje poruka računa (npr. potvrda e-pošte i oporavak lozinke) [dopuniti nakon odabira];',
            'Google Fonts: pri učitavanju stranice preglednik preuzima fontove s Googleovih poslužitelja, pa Google može primiti vašu IP adresu. [Planirano je posluživanje fontova s vlastitog poslužitelja.]',
          ]}
        />
        <P>
          S izvršiteljima postoje ugovori o obradi podataka. Javno objavljeni sadržaj (oglasi, javni podaci profila, recenzije) vidljiv je svim posjetiteljima. Podatke možemo
          dostaviti nadležnim tijelima kad nas na to obvezuje zakon.
        </P>
      </LegalSection>

      <LegalSection title="4. Prijenos izvan EU/EGP">
        <P>
          Podaci se pohranjuju u EU. Neki naši pružatelji (npr. Vercel, Google) mogu podatke obrađivati i izvan EGP-a; tada se oslanjamo na odluku o primjerenosti ili standardne
          ugovorne klauzule. [Pravnik/službenik za zaštitu podataka treba potvrditi.]
        </P>
      </LegalSection>

      <LegalSection title="5. Rok čuvanja">
        <UL
          items={[
            'podaci računa i profila: dok postoji račun; nakon brisanja računa brišemo ih ili anonimiziramo u razumnom roku, osim ako zakon traži dulje čuvanje [rok dopuniti];',
            'oglasi i recenzije: dok su objavljeni ili dok ih autor ne obriše; moderirani sadržaj čuvamo koliko je potrebno za rješavanje prijave;',
            'zapisi poslužitelja: prema pravilima pružatelja hostinga (obično kratko);',
            'e-mail poruke: [rok dopuniti].',
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Vaša prava">
        <P>Imate pravo na pristup, ispravak, brisanje, ograničenje obrade, prenosivost podataka i prigovor na obradu temeljenu na legitimnom interesu. Autor recenzije može je sam obrisati u svakom trenutku. Zahtjeve šaljite na <MailLink email={OPERATOR.email} subject="Zahtjev za ostvarivanje prava" />; odgovaramo u roku od 30 dana.</P>
        <P>Ako smatrate da obrada krši propise, imate pravo prigovora Agenciji za zaštitu osobnih podataka (AZOP), <span className="whitespace-nowrap">azop.hr</span>.</P>
      </LegalSection>

      <LegalSection title="7. Sigurnost">
        <P>Primjenjujemo tehničke i organizacijske mjere zaštite (šifrirani prijenos, kontrola pristupa na razini baze podataka, ograničena prava administratora). Nijedan sustav nije potpuno siguran; incidente koji se tiču osobnih podataka prijavljujemo u skladu sa zakonom.</P>
      </LegalSection>

      <LegalSection title="8. Kolačići i lokalna pohrana">
        <P>Opisano u <Link className="text-primary font-semibold hover:underline" to="/kolacici">Politici kolačića</Link>.</P>
      </LegalSection>

      <LegalSection title="9. Djeca">
        <P>{SERVICE_NAME} nije namijenjen osobama mlađima od 16 godina i ne prikupljamo svjesno njihove podatke.</P>
      </LegalSection>

      <LegalSection title="10. Izmjene politike">
        <P>Politiku možemo izmijeniti; aktualna verzija i datum izmjene uvijek su na ovoj stranici.</P>
      </LegalSection>
    </LegalPage>
  );
};
