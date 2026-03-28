import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ResetLozinka() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const searchParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token') ?? searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') ?? searchParams.get('refresh_token');
        const linkType = hashParams.get('type') ?? searchParams.get('type');

        if (accessToken && refreshToken && linkType === 'recovery') {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (!session) {
          setError('Link za oporavak nije valjan ili je istekao. Zatražite novu poveznicu.');
          return;
        }

        setIsReady(true);
      } catch (sessionError) {
        if (!isMounted) {
          return;
        }

        const friendlyMessage =
          sessionError instanceof Error ? sessionError.message : 'Greška pri provjeri linka za oporavak.';

        setError(friendlyMessage);
      }
    };

    initializeRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && isMounted) {
        setIsReady(true);
        setError(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Unesite novu lozinku i potvrdu lozinke.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju.');
      return;
    }

    try {
      setIsLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw updateError;
      }

      setMessage('Lozinka je uspješno promijenjena.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      const friendlyMessage =
        updateError instanceof Error ? updateError.message : 'Došlo je do greške prilikom promjene lozinke.';

      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Postavite novu lozinku</h1>
        <p className="text-slate-500 mb-8">Unesite novu lozinku za vaš račun.</p>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-2">
              Nova lozinka
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Unesite novu lozinku"
              disabled={!isReady || isLoading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">
              Potvrdite novu lozinku
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ponovno unesite lozinku"
              disabled={!isReady || isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={!isReady || isLoading}
            className="w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Spremanje...' : 'Spremi novu lozinku'}
          </button>
        </form>

        <Link to="/" className="mt-6 inline-flex text-sm text-primary font-semibold hover:underline">
          Povratak na početnu
        </Link>
      </div>
    </div>
  );
}
