import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type AuthView = 'login' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setForgotError('');
      setForgotSuccess('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) {
    return null;
  }

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Unesite email adresu kako bismo vam mogli poslati upute za reset lozinke.');
      return;
    }

    const isEmailValid = /\S+@\S+\.\S+/.test(forgotEmail);
    if (!isEmailValid) {
      setForgotError('Email adresa nije u ispravnom formatu. Provjerite unos i pokušajte ponovno.');
      return;
    }

    setForgotSuccess('Ako račun postoji, uskoro ćete dobiti email s uputama za reset lozinke.');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Zatvori modal" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Zatvori"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'login' ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Prijava</h2>
            <p className="text-slate-500 mb-6">Prijavite se za nastavak.</p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="ime@primjer.com"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Lozinka
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                Prijava
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setView('forgot-password');
                setForgotError('');
                setForgotSuccess('');
                setForgotEmail(email);
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Zaboravili ste lozinku?
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset lozinke</h2>
            <p className="text-slate-500 mb-6">Unesite email i poslat ćemo vam upute.</p>

            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="ime@primjer.com"
                />
              </div>

              {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
              {forgotSuccess && <p className="text-sm text-emerald-600">{forgotSuccess}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                Pošalji upute
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setView('login');
                setForgotError('');
                setForgotSuccess('');
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Povratak na prijavu
            </button>
          </>
        )}
      </div>
    </div>
  );
};
