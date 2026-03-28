import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearForm();
    setMessage('');
    setError('');
  };

  const closeModal = () => {
    onClose();
    clearForm();
    setMessage('');
    setError('');
    setMode('login');
  };

  useEffect(() => {
    if (!open) {
      clearForm();
      setMessage('');
      setError('');
      setLoading(false);
      setMode('login');
    }
  }, [open]);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      clearForm();
      setMessage('Provjerite email za potvrdu računa.');
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Neispravni podaci za prijavu.');
    } else {
      clearForm();
      closeModal();
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (authError) {
      const isRateLimited =
        authError.status === 429 ||
        authError.code === 'over_email_send_rate_limit' ||
        authError.message.toLowerCase().includes('rate limit');

      setError(
        isRateLimited
          ? 'Previše zahtjeva u kratkom vremenu. Pričekajte nekoliko minuta i pokušajte ponovno.'
          : authError.message,
      );
    } else {
      clearForm();
      setMessage('Ako račun postoji, poslali smo upute za reset lozinke.');
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (mode === 'register') {
      await handleRegister();
      return;
    }

    if (mode === 'login') {
      await handleLogin();
      return;
    }

    await handleResetPassword();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={closeModal}>
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'login' && 'Prijava'}
            {mode === 'register' && 'Registracija'}
            {mode === 'reset' && 'Reset lozinke'}
          </h2>
          <button type="button" onClick={closeModal} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-2 py-2 font-medium ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Prijava
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-lg px-2 py-2 font-medium ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Registracija
          </button>
          <button
            type="button"
            onClick={() => switchMode('reset')}
            className={`rounded-lg px-2 py-2 font-medium ${mode === 'reset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ime i prezime</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary"
              required
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lozinka</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary"
                required
              />
            </div>
          )}

          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? 'Učitavanje...'
              : mode === 'login'
                ? 'Prijava'
                : mode === 'register'
                  ? 'Registracija'
                  : 'Pošalji upute'}
          </button>
        </form>
      </div>
    </div>
  );
};
