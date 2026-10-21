import { Link } from 'react-router-dom';
import { LegalPage, LegalSection, MailLink, P, UL } from '../legal/LegalPage';
import { OPERATOR, SERVICE_NAME, operatorValue } from '../legal/operator';

export const UvjetiKoristenja = () => {
  return (
    <LegalPage
      title="Opći uvjeti korištenja"
      description="Pravila korištenja platforme MediHome: registracija, objava oglasa, recenzije, blokiranje računa i odgovornost."
      path="/uvjeti-koristenja"
    >
      <LegalSection title="1. Tko smo i što je MediHome">
        <P>
          {SERVICE_NAME} je internetski imenik zdravstvenih pružatelja usluga u Hrvatskoj (fizioterapija, njega u kući, najam medicinske opreme, sanitetski prijevoz).
          Platformu vodi {operatorValue(OPERATOR.name, 'naziv vlasnika stranice')}, {operatorValue(OPERATOR.address, 'adresa')}
          {' '}(podaci su navedeni i na stranici <Link className="text-primary font-semibold hover:underline" to="/impressum">Impressum</Link>).
        </P>
        <P>
          {SERVICE_NAME} je samo posrednik koji povezuje korisnike i pružatelje: <strong>ne pruža zdravstvene usluge, ne daje medicinske savjete</strong> i nije
          ugovorna strana između korisnika i pružatelja usluge.
        </P>
      </LegalSection>

      <LegalSection title="2. Prihvaćanje uvjeta i korisnički račun">
        <UL
          items={[
            'Pregledavanje oglasa moguće je bez registracije. Objava oglasa, ostavljanje recenzija i druge radnje traže korisnički račun.',
            'Račun možete otvoriti ako ste punoljetni i poslovno sposobni. Podaci koje unesete moraju biti točni i ažurni.',
            'Odgovorni ste za čuvanje lozinke i za sve radnje koje se obave preko vašeg računa. Sumnju na zlouporabu računa javite nam bez odgode.',
            'Registracijom potvrđujete da ste pročitali ove uvjete i Politiku privatnosti.',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Objava oglasa (pružatelji usluga)">
        <UL
          items={[
            'Za sadržaj oglasa (opis, cijene, kontakt, slike) odgovoran je isključivo pružatelj koji ga objavljuje. Dužni ste objaviti samo točne i ažurne podatke.',
            'Usluge koje oglašavate morate imati pravo obavljati (potrebna dopuštenja, licence ili upisi u odgovarajuće registre prema propisima za vašu djelatnost).',
            'Oglas ne smije obećavati zajamčeno izlječenje ni sadržavati obmanjujuće ili medicinski neutemeljene tvrdnje.',
            'Slike i tekstove smijete objaviti samo ako imate pravo na njih.',
            'Novi i izmijenjeni oglasi mogu biti pregledani prije objave. Oglas možemo odbiti, ukloniti ili zatražiti dopunu ako je u suprotnosti s ovim uvjetima ili propisima.',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Recenzije">
        <P>
          Korisnici mogu ocijeniti oglas na temelju vlastitog iskustva. Ocjene i komentari su mišljenja njihovih autora i <strong>nisu provjereni</strong> u smislu da ne
          provjeravamo je li autor doista koristio uslugu. Način prikaza i moderiranja objašnjen je na stranici{' '}
          <Link className="text-primary font-semibold hover:underline" to="/kako-funkcioniraju-recenzije">Kako funkcioniraju recenzije</Link>.
        </P>
        <P>Zabranjeno je pisati lažne recenzije, recenzije u zamjenu za naknadu ili korist, vrijeđati, objavljivati osobne podatke trećih osoba te ocjenjivati vlastiti oglas.</P>
      </LegalSection>

      <LegalSection title="5. Zabranjeno ponašanje">
        <UL
          items={[
            'objava nezakonitog, uvredljivog, diskriminirajućeg ili obmanjujućeg sadržaja,',
            'lažno predstavljanje, korištenje tuđih podataka ili slika bez dopuštenja,',
            'automatizirano prikupljanje podataka s platforme i opterećivanje sustava,',
            'pokušaji neovlaštenog pristupa, zaobilaženja zaštite ili mijenjanja prava pristupa,',
            'bilo koje korištenje platforme suprotno propisima Republike Hrvatske i Europske unije.',
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Moderiranje, blokiranje i uklanjanje sadržaja">
        <P>
          Zadržavamo pravo ukloniti ili sakriti oglas, recenziju ili odgovor te privremeno ili trajno blokirati račun koji krši ove uvjete. Blokirani korisnik ne može
          objavljivati oglase ni recenzije niti mijenjati podatke dok ga administrator ne odblokira. Za odblokiranje se obratite na{' '}
          <MailLink email={OPERATOR.email} subject="Zahtjev za odblokiranje računa" />.
        </P>
        <P>
          Sadržaj za koji smatrate da je nezakonit možete prijaviti kako je opisano na stranici{' '}
          <Link className="text-primary font-semibold hover:underline" to="/prijava-sadrzaja">Prijava nezakonitog sadržaja</Link>.
        </P>
      </LegalSection>

      <LegalSection title="7. Plaćeni i promovirani sadržaj">
        <P>
          Trenutno se korištenje platforme ne naplaćuje. Ako uvedemo plaćene oglase ili promociju, bit će jasno označeni kao oglas, a uvjeti i cijene objavit će se prije
          naplate. [Dopuniti ako i kada se uvedu plaćene usluge.]
        </P>
      </LegalSection>

      <LegalSection title="8. Intelektualno vlasništvo i licenca na sadržaj">
        <P>
          Dizajn, kod i oznake platforme pripadaju vlasniku {SERVICE_NAME}. Objavom sadržaja (oglasa, slika, recenzija) zadržavate svoja prava, ali nam dajete
          neisključivu, bezplatnu dozvolu da ga prikazujemo na platformi i u njezinim stranicama, uključujući pretraživanje, i dok oglas ili račun postoje.
        </P>
      </LegalSection>

      <LegalSection title="9. Ograničenje odgovornosti">
        <UL
          items={[
            `${SERVICE_NAME} ne jamči točnost, potpunost ni dostupnost podataka koje unose treće strane niti kvalitetu ili ishod usluga pružatelja.`,
            'Platforma se pruža „kakva jest“; moguće su privremene nedostupnosti zbog održavanja ili tehničkih smetnji.',
            'Odgovornost se ne isključuje ni ne ograničava u mjeri u kojoj to nije dopušteno propisima, osobito u pogledu namjere ili grube nepažnje te prava potrošača.',
          ]}
        />
        <P>Više u dokumentu <Link className="text-primary font-semibold hover:underline" to="/odricanje-odgovornosti">Odricanje od odgovornosti</Link>.</P>
      </LegalSection>

      <LegalSection title="10. Zaštita osobnih podataka">
        <P>
          Kako obrađujemo osobne podatke opisano je u <Link className="text-primary font-semibold hover:underline" to="/politika-privatnosti">Politici privatnosti</Link> i{' '}
          <Link className="text-primary font-semibold hover:underline" to="/kolacici">Politici kolačića</Link>.
        </P>
      </LegalSection>

      <LegalSection title="11. Izmjene uvjeta">
        <P>
          Uvjete možemo izmijeniti radi usklađivanja s propisima ili razvoja usluge. Izmijenjena verzija objavljuje se na ovoj stranici s datumom zadnje izmjene i vrijedi
          od objave. Nastavak korištenja nakon izmjene smatra se prihvaćanjem. O bitnim izmjenama registrirane korisnike obavještavamo na prikladan način.
        </P>
      </LegalSection>

      <LegalSection title="12. Mjerodavno pravo i nadležnost">
        <P>
          Primjenjuje se pravo Republike Hrvatske. Za sporove je nadležan sud prema sjedištu vlasnika platforme ({operatorValue(OPERATOR.address, 'sjedište')}), osim ako
          obvezujući propisi o zaštiti potrošača određuju drukčije. [Pravnik treba potvrditi formulaciju, osobito za potrošače.]
        </P>
      </LegalSection>

      <LegalSection title="13. Kontakt">
        <P>
          Pitanja o uvjetima: <MailLink email={OPERATOR.email} />.
        </P>
      </LegalSection>
    </LegalPage>
  );
};
