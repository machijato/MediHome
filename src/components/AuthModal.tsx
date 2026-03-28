import React, { useMemo, useState } from 'react';
import * as supabaseModule from '../lib/supabase';

type Mode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const supabase =
  (supabaseModule as any).supabase ??
  (supabaseModule as any).default ??
  (typeof window !== 'undefined' ? (window as any).supabase : null);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const title = useMemo(() => {
    if (mode === 'register') return 'Registracija';
    if (mode === 'reset') return 'Reset lozinke';
    return 'Prijava';
  }, [mode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (!supabase?.auth?.signInWithPassword) {
        throw new Error('Supabase nije konfiguriran.');
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Došlo je do greške. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (!supabase?.auth?.signUp) {
        throw new Error('Supabase nije konfiguriran.');
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      setMessage('Provjerite email za potvrdu računa.');
    } catch (err: any) {
      setError(err?.message || 'Došlo je do greške. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (!supabase?.auth?.resetPasswordForEmail) {
        throw new Error('Supabase nije konfiguriran.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;

      setMessage('Ako račun postoji, poslali smo upute za reset lozinke.');
    } catch (err: any) {
      if (err?.message?.toLowerCase?.().includes('rate limit')) {
        setError('Previše zahtjeva u kratkom vremenu. Pričekajte nekoliko minuta i pokušajte ponovno.');
      } else {
        setError('Došlo je do greške. Pokušajte ponovno.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose}>×</button>
        </div>

        {mode !== 'reset' && (
          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => setMode('login')}>
              Prijava
            </button>
            <button type="button" onClick={() => setMode('register')}>
              Registracija
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded border px-3 py-2"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lozinka"
              className="w-full rounded border px-3 py-2"
              required
            />
            <button
              type="button"
              onClick={() => setMode('reset')}
              className="text-sm text-blue-600"
            >
              Zaboravljena lozinka?
            </button>
            <button type="submit" disabled={loading} className="w-full rounded bg-slate-900 px-4 py-2 text-white">
              {loading ? 'Učitavanje...' : 'Prijava'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded border px-3 py-2"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lozinka"
              className="w-full rounded border px-3 py-2"
              required
            />
            <button type="submit" disabled={loading} className="w-full rounded bg-slate-900 px-4 py-2 text-white">
              {loading ? 'Učitavanje...' : 'Registracija'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded border px-3 py-2"
              required
            />
            <button type="submit" disabled={loading} className="w-full rounded bg-slate-900 px-4 py-2 text-white">
              {loading ? 'Slanje...' : 'Pošalji upute'}
            </button>
            <button type="button" onClick={() => setMode('login')} className="text-sm text-blue-600">
              Povratak na prijavu
            </button>
          </form>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-green-600">{message}</p> : null}
      </div>
    </div>
  );
};
