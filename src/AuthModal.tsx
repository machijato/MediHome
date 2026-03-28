import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

type AuthView = 'login' | 'signup' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const title = useMemo(() => {
    if (view === 'signup') return 'Registracija';
    if (view === 'reset') return 'Reset lozinke';
    return 'Prijava';
  }, [view]);

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const changeView = (nextView: AuthView) => {
    resetMessages();
    setView(nextView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setInfo('Provjerite email za potvrdu registracije.');
    setLoading(false);
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setInfo('Ako račun postoji za ovu email adresu, poslali smo link za promjenu lozinke.');
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="Zatvori">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {(view === 'login' || view === 'signup') && (
                <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="ime@domena.hr"
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

                  {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                  {info && <p className="text-sm text-emerald-600 font-medium">{info}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {view === 'login' ? 'Prijavi se' : 'Registriraj se'}
                  </button>

                  <div className="pt-2 flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => changeView(view === 'login' ? 'signup' : 'login')}
                      className="text-primary font-semibold hover:underline"
                    >
                      {view === 'login' ? 'Nemaš račun? Registriraj se' : 'Već imaš račun? Prijavi se'}
                    </button>

                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => changeView('reset')}
                        className="text-slate-600 font-semibold hover:text-primary hover:underline"
                      >
                        Zaboravljena lozinka?
                      </button>
                    )}
                  </div>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="ime@domena.hr"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                  {info && <p className="text-sm text-emerald-600 font-medium">{info}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Pošalji link za reset lozinke
                  </button>

                  <button
                    type="button"
                    onClick={() => changeView('login')}
                    className="w-full py-3 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Natrag na prijavu
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
