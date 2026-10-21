import { Link } from 'react-router-dom';
import { LegalPage, LegalSection, MailLink, P, UL } from '../legal/LegalPage';
import { OPERATOR } from '../legal/operator';

export const KakoFunkcionirajuRecenzije = () => {
  return (
    <LegalPage
      title="Kako funkcioniraju recenzije"
      description="Tko može ostaviti recenziju na MediHome, kako se računa ocjena, što moderiramo i kako prijaviti spornu recenziju."
      path="/kako-funkcioniraju-recenzije"
    >
      <LegalSection title="Tko može ostaviti recenziju">
        <UL
          items={[
            'Recenziju mogu ostaviti samo prijavljeni korisnici.',
            'Jedan korisnik može imati jednu recenziju po oglasu; ponovno slanje uređuje postojeću.',
            'Pružatelj ne može ocijeniti vlastiti oglas.',
            'Autor može svoju recenziju urediti ili obrisati u svakom trenutku.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Što to znači: recenzije su neprovjerene">
        <P>
          Pri objavi autor potvrđuje da je koristio uslugu i navodi mjesec korištenja, ali <strong>to ne provjeravamo</strong>. Recenzije su mišljenja njihovih autora, a ne stav ni
          preporuka platforme. Ne smijete se oslanjati na njih kao na medicinsku ili stručnu procjenu.
        </P>
      </LegalSection>

      <LegalSection title="Kako se računa ocjena">
        <P>
          Autor odgovara na nekoliko pitanja ocjenom od 1 do 5 (npr. kvaliteta usluge, komunikacija, cijena kao dogovorena). Ocjena recenzije je prosjek tih odgovora, a
          ocjena oglasa prosjek ocjena svih objavljenih recenzija. Kod oglasa vidite i prosjek po pojedinom pitanju. Oglasi bez recenzija prikazuju se kao „Nema ocjena“.
        </P>
      </LegalSection>

      <LegalSection title="Što prikazujemo uz recenziju">
        <P>Prikazuju se ocjene, komentar, mjesec korištenja usluge te ime i početno slovo prezimena autora. E-mail adresa autora nikada se ne prikazuje.</P>
      </LegalSection>

      <LegalSection title="Odgovor pružatelja i prijava recenzije">
        <UL
          items={[
            'Pružatelj može javno odgovoriti na recenziju o svojem oglasu.',
            'Pružatelj može prijaviti recenziju koju smatra lažnom, uvredljivom ili neovisnom o uslugi (npr. autor nije koristio uslugu). Prijavu pregledava administrator.',
            'Pružatelj ne može sam ukloniti, urediti ni sakriti recenziju, niti utjecati na ocjenu.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Moderiranje">
        <P>
          Administrator može sakriti ili ukloniti recenziju koja krši <Link className="text-primary font-semibold hover:underline" to="/uvjeti-koristenja">Uvjete korištenja</Link> (npr.
          lažna, uvredljiva, sadrži osobne podatke trećih osoba ili je plaćena). Ako uredimo komentar (npr. uklonimo osobni podatak), uz recenziju se to jasno označava. Ocjene ne
          mijenjamo i ne uklanjamo ih zbog toga što su loše.
        </P>
        <P>Recenzije se ne mogu kupiti niti se uklanjaju na zahtjev pružatelja uz naknadu.</P>
      </LegalSection>

      <LegalSection title="Imate pitanje ili primjedbu?">
        <P>
          Za sporne recenzije javite se putem <Link className="text-primary font-semibold hover:underline" to="/prijava-sadrzaja">prijave sadržaja</Link> ili na{' '}
          <MailLink email={OPERATOR.email} subject="Recenzije" />.
        </P>
      </LegalSection>
    </LegalPage>
  );
};
