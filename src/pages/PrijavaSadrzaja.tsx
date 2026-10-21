import { Link } from 'react-router-dom';
import { LegalPage, LegalSection, MailLink, P, UL } from '../legal/LegalPage';
import { OPERATOR, SERVICE_NAME } from '../legal/operator';

export const PrijavaSadrzaja = () => {
  const subject = encodeURIComponent('Prijava nezakonitog sadržaja');
  const body = encodeURIComponent(
    'Poveznica (URL) na sporni sadržaj:\n\nZašto smatrate da je sadržaj nezakonit ili neprimjeren:\n\nVaše ime i e-mail (za odgovor):\n\nIzjavljujem da su podaci u ovoj prijavi, prema mojem najboljem saznanju, točni i potpuni.',
  );

  return (
    <LegalPage
      title="Prijava nezakonitog sadržaja"
      description="Kako prijaviti nezakonit ili neprimjeren oglas, recenziju ili drugi sadržaj na MediHome i što se događa nakon prijave."
      path="/prijava-sadrzaja"
    >
      <LegalSection title="Kako prijaviti">
        <P>
          Ako na {SERVICE_NAME} naiđete na oglas, recenziju ili drugi sadržaj za koji smatrate da je nezakonit, obmanjujući ili krši vaša prava, prijavite nam ga e-poštom:
        </P>
        <p>
          <a
            data-testid="report-content-mailto"
            className="inline-block px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90"
            href={`mailto:${OPERATOR.email}?subject=${subject}&body=${body}`}
          >
            Pošalji prijavu e-poštom
          </a>
        </p>
        <P>Ili pišite izravno na <MailLink email={OPERATOR.email} />. U prijavi navedite:</P>
        <UL
          items={[
            'točnu poveznicu (URL) na sporni sadržaj,',
            'objašnjenje zašto smatrate da je sadržaj nezakonit ili neprimjeren (i, ako se radi o povredi prava, na koje se pravo odnosi),',
            'svoje ime i e-mail adresu za odgovor (osim ako se radi o sadržaju kod kojeg je anonimna prijava prikladna).',
          ]}
        />
        <P>Pružatelji usluga koji su prijavili recenziju o svojem oglasu to mogu učiniti i izravno u aplikaciji, uz oglas ili u „Moj profil“.</P>
      </LegalSection>

      <LegalSection title="Što se događa nakon prijave">
        <UL
          items={[
            'Potvrdu primitka šaljemo bez nepotrebne odgode.',
            'Prijavu pregledavamo pažljivo i objektivno. Sadržaj koji je očito nezakonit uklanjamo ili onemogućujemo bez odgode.',
            'O odluci obavještavamo podnositelja prijave i autora sadržaja te navodimo razloge, osim kad bi to ugrozilo istragu ili je zakonom zabranjeno.',
            'Autor može uložiti prigovor na odluku o uklanjanju ili blokiranju na istu adresu e-pošte.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Napomene">
        <UL
          items={[
            'Lažne ili zlonamjerne prijave mogu dovesti do blokiranja računa podnositelja.',
            'Za hitne zdravstvene situacije ne koristite ovu stranicu: nazovite 112 ili hitnu medicinsku pomoć 194.',
            'Ova stranica ne zamjenjuje pravne postupke pred nadležnim tijelima.',
          ]}
        />
        <P>
          Pročitajte i <Link className="text-primary font-semibold hover:underline" to="/uvjeti-koristenja">Uvjete korištenja</Link> te{' '}
          <Link className="text-primary font-semibold hover:underline" to="/kako-funkcioniraju-recenzije">Kako funkcioniraju recenzije</Link>.
        </P>
      </LegalSection>
    </LegalPage>
  );
};
