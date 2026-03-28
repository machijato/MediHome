import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { supabase } from './lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetFeedback = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const switchView = (nextView: AuthView) => {
    setView(nextView);
    resetFeedback();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Uspješno ste prijavljeni.');
    setIsLoading(false);
    onClose();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Račun je uspješno kreiran. Provjerite email za potvrdu.');
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage('Ako račun postoji za ovu email adresu, poslali smo link za promjenu lozinke.');
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{view === 'signup' ? 'Registracija' : 'Prijava'}</h2>
                <p className="text-sm text-slate-500">
                  {view === 'forgot-password' ? 'Reset lozinke' : 'Dobrodošli u MediHome'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {view !== 'forgot-password' ? (
                <form onSubmit={view === 'signup' ? handleSignup : handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="ime@primjer.hr"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Lozinka</label>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
                  >
                    {isLoading ? 'Pričekajte...' : view === 'signup' ? 'Registriraj se' : 'Prijavi se'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="ime@primjer.hr"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
                  >
                    {isLoading ? 'Pričekajte...' : 'Pošalji link za reset lozinke'}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="w-full text-primary font-bold hover:underline"
                  >
                    Povratak na prijavu
                  </button>
                </form>
              )}

              {view === 'login' && (
                <button
                  type="button"
                  onClick={() => switchView('forgot-password')}
                  className="mt-4 text-sm font-semibold text-primary hover:underline"
                >
                  Zaboravljena lozinka?
                </button>
              )}

              {view !== 'forgot-password' && (
                <button
                  type="button"
                  onClick={() => switchView(view === 'signup' ? 'login' : 'signup')}
                  className="mt-4 block text-sm text-slate-600 hover:text-primary transition-colors"
                >
                  {view === 'signup' ? 'Već imate račun? Prijavite se' : 'Nemate račun? Registrirajte se'}
                </button>
              )}

              {successMessage && <p className="mt-4 text-sm text-emerald-600 font-medium">{successMessage}</p>}
              {errorMessage && <p className="mt-4 text-sm text-red-600 font-medium">{errorMessage}</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
