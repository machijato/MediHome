import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ADMIN_CONTACT_EMAIL } from '../lib/contact';

const CATEGORIES = [
  { name: 'Fizioterapeuti', slug: 'fizioterapeut' },
  { name: 'Kućna njega', slug: 'kucna-njega' },
  { name: 'Najam opreme', slug: 'najam-opreme' },
  { name: 'Sanitetski prijevoz', slug: 'sanitetski-prijevoz' },
];

export function ONamaPage({ onPostAdClick }: { onPostAdClick: () => void }) {
  return (
    <div data-testid="about-page" className="bg-slate-50">
      <SEO
        title="O nama"
        description="MediHome je hrvatski imenik pružatelja zdravstvenih usluga i opreme: fizioterapeuti, kućna njega, najam opreme i sanitetski prijevoz na jednom mjestu."
        canonicalPath="/o-nama"
      />
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <nav className="text-sm text-slate-500">
          <Link to="/" className="hover:text-primary">Početna</Link> <span aria-hidden>›</span> O nama
        </nav>

        <header className="space-y-4">
          <h1 data-testid="about-title" className="text-4xl md:text-5xl font-extrabold text-slate-900">O nama</h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            MediHome je imenik koji povezuje ljude kojima je potrebna pomoć kod kuće s fizioterapeutima, pružateljima njege,
            najmom medicinske opreme i sanitetskim prijevozom. Na jednom mjestu možete pregledati oglase, usporediti ih i izravno kontaktirati pružatelja.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Što možete pronaći</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/kategorija/${c.slug}`}
                  className="block bg-white rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-800 hover:border-primary hover:text-primary transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Za korisnike</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
              <li>Pretraživanje po kategoriji, županiji, cijeni i vrsti usluge.</li>
              <li>Pregled oglasa, opisa i ocjena drugih korisnika.</li>
              <li>Izravan kontakt s pružateljem usluge.</li>
            </ul>
            <p className="text-sm text-slate-500">
              Recenzije su mišljenja korisnika; <Link to="/kako-funkcioniraju-recenzije" className="text-primary font-semibold hover:underline">pročitajte kako funkcioniraju</Link>.
            </p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Za pružatelje usluga</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
              <li>Objava oglasa s opisom, cijenom, lokacijom i slikama.</li>
              <li>Upravljanje oglasima i profilom na jednom mjestu.</li>
              <li>Odgovaranje na recenzije korisnika.</li>
            </ul>
            <button
              type="button"
              data-testid="about-post-ad"
              onClick={onPostAdClick}
              className="mt-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-colors"
            >
              Objavi oglas
            </button>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Važno je znati</h2>
          <p className="text-slate-600 leading-relaxed">
            MediHome je posrednik i imenik: ne pružamo zdravstvene usluge niti dajemo medicinske savjete. Za hitne slučajeve nazovite 112, a za zdravstvene odluke obratite se liječniku.{' '}
            <Link to="/odricanje-odgovornosti" className="text-primary font-semibold hover:underline">Odricanje od odgovornosti</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Blog i kontakt</h2>
          <p className="text-slate-600 leading-relaxed">
            Na <Link to="/clanci" data-testid="about-blog-link" className="text-primary font-semibold hover:underline">blogu</Link> objavljujemo savjete o zdravlju, rehabilitaciji i njezi.
            Pitanja, prijedlozi i primjedbe: <a href={`mailto:${ADMIN_CONTACT_EMAIL}`} className="text-primary font-semibold hover:underline">{ADMIN_CONTACT_EMAIL}</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
