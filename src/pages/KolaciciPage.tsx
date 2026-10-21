import { Link } from 'react-router-dom';
import { LegalPage, LegalSection, MailLink, P, UL } from '../legal/LegalPage';
import { OPERATOR } from '../legal/operator';

export const KolaciciPage = () => {
  return (
    <LegalPage
      title="Politika kolačića"
      description="Što MediHome sprema u vaš preglednik (kolačići i lokalna pohrana) i kako to možete kontrolirati."
      path="/kolacici"
    >
      <LegalSection title="Ukratko">
        <P>
          MediHome <strong>ne koristi kolačiće za analitiku, praćenje ni oglašavanje</strong>. Sprema samo ono što je nužno da biste ostali prijavljeni i da se pamte
          vaše postavke. Zato trenutno nije potreban baner s pristankom. Ako ikada uvedemo nenužne kolačiće ili alate trećih strana, tražit ćemo vaš pristanak prije korištenja.
        </P>
      </LegalSection>

      <LegalSection title="Što spremamo u vaš preglednik">
        <div className="overflow-x-auto">
          <table data-testid="cookie-table" className="w-full text-sm text-left text-slate-600 border border-slate-200 rounded-xl overflow-hidden bg-white">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                <th className="px-4 py-3">Naziv</th>
                <th className="px-4 py-3">Svrha</th>
                <th className="px-4 py-3">Trajanje</th>
                <th className="px-4 py-3">Vrsta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-mono text-xs">sb-…-auth-token (lokalna pohrana)</td>
                <td className="px-4 py-3">Održava vašu prijavu kako vas aplikacija ne bi odjavljivala pri osvježavanju stranice.</td>
                <td className="px-4 py-3">Do odjave</td>
                <td className="px-4 py-3">Nužno</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">medihome:notifications-seen:… (lokalna pohrana)</td>
                <td className="px-4 py-3">Pamti koje obavijesti u zvončiću ste već vidjeli.</td>
                <td className="px-4 py-3">Dok ne obrišete podatke preglednika</td>
                <td className="px-4 py-3">Funkcionalno</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>Ti zapisi ostaju u vašem pregledniku i ne šalju se trećim stranama radi praćenja.</P>
      </LegalSection>

      <LegalSection title="Sadržaj trećih strana">
        <P>
          Pri učitavanju stranice preglednik preuzima fontove s Google Fonts, pa Google može primiti vašu IP adresu. [Planirano je posluživanje fontova s našeg poslužitelja, nakon čega
          ova stavka otpada.] Više u <Link className="text-primary font-semibold hover:underline" to="/politika-privatnosti">Politici privatnosti</Link>.
        </P>
      </LegalSection>

      <LegalSection title="Kako upravljati pohranom">
        <UL
          items={[
            'U postavkama preglednika možete obrisati kolačiće i podatke stranica ili ih blokirati. Brisanje nužnih zapisa odjavit će vas.',
            'Odjavom iz aplikacije uklanja se zapis o prijavi.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Pitanja">
        <P>
          Pišite nam na <MailLink email={OPERATOR.email} subject="Pitanje o kolačićima" />.
        </P>
      </LegalSection>
    </LegalPage>
  );
};
