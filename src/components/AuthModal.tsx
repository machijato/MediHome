import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  isRecovery?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, isRecovery = false }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [mode, setMode] = useState<'auth' | 'forgot-password' | 'recovery'>('auth');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isRecovery) {
      setMode('recovery');
      setPassword('');
      setConfirmPassword('');
      resetMessages();
      return;
    }

    setMode('auth');
    setPassword('');
    setConfirmPassword('');
    resetMessages();
  }, [isRecovery, open]);

  const handleClose = () => {
    resetMessages();
    setMode('auth');
    setConfirmPassword('');
    onClose();
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setMode('auth');
    resetMessages();
  };

  const handleForgotPasswordMode = () => {
    setMode('forgot-password');
    setPassword('');
    resetMessages();
  };

  const handleBackToLogin = () => {
    setMode('auth');
    setActiveTab('login');
    resetMessages();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    resetMessages();
    setLoading(true);

    try {
      if (mode === 'recovery') {
        if (password.length < 6) {
          setErrorMessage('Lozinka mora imati najmanje 6 znakova.');
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage('Lozinke se ne podudaraju.');
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setSuccessMessage('Lozinka uspješno promijenjena');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://medi-home-chi.vercel.app/reset-password',
        });

        if (error) {
          const isRateLimitError =
            error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many');
          if (isRateLimitError) {
            setErrorMessage('Previše zahtjeva u kratkom vremenu. Pričekajte nekoliko minuta i pokušajte ponovno.');
          } else {
            setErrorMessage('Došlo je do greške. Pokušajte ponovno.');
          }
          return;
        }

        setSuccessMessage('Ako račun postoji, poslali smo upute za reset lozinke.');
        return;
      }

      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage('Neispravni podaci za prijavu.');
          return;
        }

        setSuccessMessage('Uspješno ste prijavljeni.');
        setEmail('');
        setPassword('');
        setFullName('');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMessage(`Greška pri registraciji: ${error.message}`);
        return;
      }

      setSuccessMessage('Provjerite email za potvrdu računa.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Zatvori modal"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/50"
      />

      <div
        data-testid="auth-modal"
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'auth' ? 'Prijava' : 'Reset lozinke'}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'auth' && (
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Prijava
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Registracija
            </button>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'auth' && activeTab === 'register' && (
            <div>
              <label htmlFor="auth-full-name" className="block text-sm font-medium text-slate-700 mb-1">
                Ime i prezime
              </label>
              <input
                id="auth-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ime Prezime"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {mode !== 'recovery' && (
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="auth-email"
                data-testid="auth-email-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="unesite@email.hr"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {mode === 'auth' && (
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1">
                Lozinka
              </label>
              <input
                id="auth-password"
                data-testid="auth-password-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {mode === 'recovery' && (
            <>
              <div>
                <label htmlFor="auth-new-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Nova lozinka
                </label>
                <input
                  id="auth-new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Potvrdite novu lozinku
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </>
          )}

          {mode === 'auth' && activeTab === 'login' && (
            <button
              type="button"
              onClick={handleForgotPasswordMode}
              className="text-sm text-slate-600 hover:text-primary transition-colors"
            >
              Zaboravljena lozinka?
            </button>
          )}

          {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
          {successMessage && <p className="text-sm font-medium text-green-600">{successMessage}</p>}

          <button
            type="submit"
            data-testid="auth-submit-button"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Učitavanje...'
              : mode === 'recovery'
                ? 'Spremi novu lozinku'
                : mode === 'forgot-password'
                  ? 'Pošalji upute'
                  : activeTab === 'login'
                    ? 'Prijava'
                    : 'Registracija'}
          </button>

          {mode === 'forgot-password' && !isRecovery && (
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full text-sm text-slate-600 hover:text-primary transition-colors"
            >
              Povratak na prijavu
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
