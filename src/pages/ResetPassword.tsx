import React, { useEffect, useState } from 'react';
import * as supabaseModule from '../lib/supabase';

const supabase =
  (supabaseModule as any).supabase ??
  (supabaseModule as any).default ??
  (typeof window !== 'undefined' ? (window as any).supabase : null);

export const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (!supabase?.auth?.getSession) {
          if (mounted) {
            setError('Supabase nije konfiguriran.');
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setReady(Boolean(data?.session));
        }

        const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
          if (!mounted) return;
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setReady(Boolean(session));
            setError('');
          }
        });

        return () => {
          listener?.subscription?.unsubscribe?.();
        };
      } catch {
        if (mounted) {
          setError('Došlo je do greške. Pokušajte ponovno.');
        }
      }
    };

    const cleanupPromise = init();

    return () => {
      mounted = false;
      Promise.resolve(cleanupPromise).then((cleanup) => cleanup?.());
    };
  }, []);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (!supabase?.auth?.updateUser) {
        throw new Error('Supabase nije konfiguriran.');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setMessage('Lozinka uspješno promijenjena.');

      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch {
      setError('Došlo je do greške. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold">Reset lozinke</h1>

        {!ready ? (
          <p className="text-sm text-slate-600">Otvorite link iz email poruke kako biste postavili novu lozinku.</p>
        ) : (
          <form onSubmit={handleSavePassword} className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova lozinka"
              className="w-full rounded border px-3 py-2"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Potvrdite novu lozinku"
              className="w-full rounded border px-3 py-2"
              required
            />
            <button type="submit" disabled={loading} className="w-full rounded bg-slate-900 px-4 py-2 text-white">
              {loading ? 'Spremanje...' : 'Spremi novu lozinku'}
            </button>
          </form>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
      </div>
    </div>
  );
};

export default ResetPassword;
