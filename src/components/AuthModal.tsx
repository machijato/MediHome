import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError('Neispravni podaci za prijavu.');
      setLoading(false);
      return;
    }

    setEmail('');
    setPassword('');
    setLoading(false);
    onClose();
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: registerError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (registerError) {
      setError(registerError.message || 'Došlo je do greške. Pokušajte ponovno.');
      setLoading(false);
      return;
    }

    setSuccess('Provjerite email za potvrdu računa.');
    setPassword('');
    setLoading(false);
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { error: forgotError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (forgotError) {
        const normalizedMessage = `${forgotError.message || ''}`.toLowerCase();
        if (normalizedMessage.includes('rate') || normalizedMessage.includes('too many')) {
          setError('Previše zahtjeva u kratkom vremenu. Pričekajte nekoliko minuta i pokušajte ponovno.');
        } else {
          setError('Došlo je do greške. Pokušajte ponovno.');
        }
        return;
      }

      setSuccess('Ako račun postoji, poslali smo upute za reset lozinke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Račun</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode !== 'forgot' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-medium ${
                mode === 'login' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Prijava
            </button>
            <button
              onClick={() => {
                setMode('register');
                resetMessages();
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-medium ${
                mode === 'register' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Registracija
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {success && <p className="text-sm text-emerald-600 mb-4">{success}</p>}

        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <input
              type="password"
              placeholder="Lozinka"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                resetMessages();
              }}
              className="text-sm text-primary hover:underline"
            >
              Zaboravljena lozinka?
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Prijava...' : 'Prijava'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <input
              type="password"
              placeholder="Lozinka"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Registracija...' : 'Registracija'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Slanje...' : 'Pošalji upute'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className="text-sm text-primary hover:underline"
            >
              Povratak na prijavu
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
