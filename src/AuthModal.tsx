import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from './lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setView('login');
    setEmail('');
    setPassword('');
    setMessage(null);
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
    } else {
      handleClose();
    }

    setIsLoading(false);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Ako račun postoji za ovu email adresu, poslali smo link za promjenu lozinke.');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div onClick={handleClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {view === 'forgot-password' ? 'Reset lozinke' : 'Prijava'}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="Zatvori">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="vas@email.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-bold text-slate-700 mb-2">Lozinka</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {isLoading ? 'Prijava u tijeku...' : 'Prijavi se'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMessage(null);
                  setView('forgot-password');
                }}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Zaboravljena lozinka?
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="vas@email.com"
                />
              </div>

              {message && <p className="text-sm text-emerald-700 font-medium">{message}</p>}
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {isLoading ? 'Slanje...' : 'Pošalji link za reset lozinke'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMessage(null);
                  setView('login');
                }}
                className="text-sm text-slate-600 hover:text-slate-900 font-semibold"
              >
                Nazad na prijavu
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
