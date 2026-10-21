import { Link } from 'react-router-dom';
import { LegalPage, LegalSection, P } from '../legal/LegalPage';
import { SERVICE_NAME } from '../legal/operator';

export const OdricanjeOdgovornosti = () => {
  return (
    <LegalPage
      title="Odricanje od odgovornosti"
      description="MediHome je imenik pružatelja zdravstvenih usluga i ne pruža medicinske savjete ni zdravstvene usluge."
      path="/odricanje-odgovornosti"
    >
      <LegalSection title="Hitna stanja">
        <div data-testid="emergency-note" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900">
          U hitnom ili životno ugrožavajućem stanju odmah nazovite <strong>112</strong> (jedinstveni europski broj) ili <strong>194</strong> (hitna medicinska pomoć). Ne koristite ovu platformu za hitne slučajeve.
        </div>
      </LegalSection>

      <LegalSection title="Opće informacije">
        <P>
          Sadržaj na platformi služi samo za informiranje i ne predstavlja jamstvo kvalitete, ishoda liječenja ni prikladnosti pojedine usluge za svakog korisnika.
        </P>
      </LegalSection>

      <LegalSection title="Nema medicinskih savjeta">
        <P>
          {SERVICE_NAME} ne pruža zdravstvene usluge i ne daje medicinske savjete. Informacije, članci i oglasi ne zamjenjuju stručni pregled, dijagnozu ni terapiju. O svojem
          zdravstvenom stanju razgovarajte s liječnikom ili drugim kvalificiranim zdravstvenim djelatnikom.
        </P>
      </LegalSection>

      <LegalSection title="Odgovornost za usluge">
        <P>
          Usluge pružaju neovisni pružatelji koji su odgovorni za svoj rad i za sadržaj svojih oglasa. {SERVICE_NAME} nije ugovorna strana između korisnika i pružatelja
          te ne odgovara za njihove međusobne obveze, cijene, kvalitetu ni ishod usluge. Prije korištenja usluge sami provjerite potrebne podatke, kvalifikacije i uvjete.
        </P>
      </LegalSection>

      <LegalSection title="Točnost informacija i recenzije">
        <P>
          Podatke u oglasima unose treće strane i ne možemo jamčiti njihovu točnost, potpunost ni ažurnost. Recenzije su mišljenja korisnika i nisu provjerene (vidi{' '}
          <Link className="text-primary font-semibold hover:underline" to="/kako-funkcioniraju-recenzije">Kako funkcioniraju recenzije</Link>).
        </P>
      </LegalSection>

      <LegalSection title="Korištenje platforme">
        <P>
          Platformu koristite na vlastitu odgovornost. Zadržavamo pravo mijenjati sadržaj i privremeno ograničiti dostupnost platforme. Ništa u ovom odricanju ne isključuje
          odgovornost koja se prema propisima ne može isključiti, uključujući prava potrošača. Pogledajte i{' '}
          <Link className="text-primary font-semibold hover:underline" to="/uvjeti-koristenja">Opće uvjete korištenja</Link>.
        </P>
      </LegalSection>
    </LegalPage>
  );
};
