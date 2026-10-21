import { LegalPage, LegalSection, MailLink, P } from '../legal/LegalPage';
import { OPERATOR, SERVICE_NAME, operatorValue } from '../legal/operator';

export const ImpressumPage = () => {
  return (
    <LegalPage
      title="Impressum"
      description="Podaci o vlasniku i pružatelju usluge MediHome."
      path="/impressum"
    >
      <LegalSection title="Pružatelj usluge">
        <dl data-testid="impressum-details" className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-x-6 gap-y-3 text-slate-600">
          <dt className="font-semibold text-slate-900">Naziv</dt>
          <dd>{operatorValue(OPERATOR.name, 'naziv ili ime i prezime')}</dd>
          <dt className="font-semibold text-slate-900">Sjedište / adresa</dt>
          <dd>{operatorValue(OPERATOR.address, 'adresa')}</dd>
          <dt className="font-semibold text-slate-900">OIB</dt>
          <dd>{operatorValue(OPERATOR.oib, 'OIB')}</dd>
          <dt className="font-semibold text-slate-900">Registracija</dt>
          <dd>{operatorValue(OPERATOR.registry, 'upis u registar, ako postoji')}</dd>
          <dt className="font-semibold text-slate-900">E-pošta</dt>
          <dd><MailLink email={OPERATOR.email} /></dd>
          <dt className="font-semibold text-slate-900">Telefon</dt>
          <dd>{operatorValue(OPERATOR.phone, 'telefon, ako se želi navesti')}</dd>
        </dl>
      </LegalSection>

      <LegalSection title="O usluzi">
        <P>
          {SERVICE_NAME} je internetski imenik zdravstvenih pružatelja usluga u Hrvatskoj. Ne pruža zdravstvene usluge niti medicinske savjete. Podatke u oglasima unose
          sami pružatelji usluga.
        </P>
      </LegalSection>

      <LegalSection title="Kontakt za prijavu nezakonitog sadržaja">
        <P>
          Sadržaj za koji smatrate da je nezakonit prijavite na stranici{' '}
          <a className="text-primary font-semibold hover:underline" href="/prijava-sadrzaja">Prijava nezakonitog sadržaja</a> ili e-poštom na <MailLink email={OPERATOR.email} />.
        </P>
      </LegalSection>
    </LegalPage>
  );
};
