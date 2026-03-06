import React from 'react';
import { Navbar } from './Navbar';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onPostAdClick={() => window.location.assign('/')} />

      <main className="flex-1 py-16 px-4">
        <article className="max-w-[800px] mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-12 space-y-10">
          <header>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Opći uvjeti korištenja</h1>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">1. Uvod</h2>
            <p className="text-slate-600 leading-relaxed">
              Ova platforma omogućuje povezivanje korisnika s pružateljima zdravstvenih i pomoćnih usluga kao
              što su fizioterapija, njega u kući, sanitetski prijevoz te najam i prodaja medicinske opreme.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Korištenjem ove stranice korisnik prihvaća ove uvjete korištenja.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">2. Odgovornost za sadržaj oglasa</h2>
            <p className="text-slate-600 leading-relaxed">
              Pružatelji usluga odgovorni su za točnost informacija objavljenih u svojim oglasima.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Platforma ne jamči točnost niti kvalitetu usluga koje pružaju treće strane.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">3. Korištenje platforme</h2>
            <p className="text-slate-600 leading-relaxed">Korisnici se obvezuju:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>objavljivati točne podatke</li>
              <li>ne zloupotrebljavati platformu</li>
              <li>ne objavljivati lažne ili obmanjujuće informacije</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">4. Privatnost podataka</h2>
            <p className="text-slate-600 leading-relaxed">
              Osobni podaci korisnika obrađuju se u skladu s važećim zakonima o zaštiti osobnih podataka (GDPR).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">5. Izmjene uvjeta</h2>
            <p className="text-slate-600 leading-relaxed">
              Platforma zadržava pravo izmjene uvjeta korištenja u bilo kojem trenutku.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">6. Kontakt</h2>
            <p className="text-slate-600 leading-relaxed">
              Za pitanja vezana uz uvjete korištenja korisnici se mogu obratiti administratoru platforme.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};
