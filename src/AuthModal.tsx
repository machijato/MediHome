import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { authApi } from './lib/supabase';

type AuthView = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const title = useMemo(() => {
    if (view === 'register') return 'Registracija';
    if (view === 'forgot') return 'Reset lozinke';
    return 'Prijava';
  }, [view]);

  const resetFeedback = () => setMessage(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);
    try {
      await authApi.signInWithPassword({ email, password });
      setMessage({ type: 'success', text: 'Uspješna prijava.' });
      onClose();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Prijava nije uspjela.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Lozinke se ne podudaraju.' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.signUp({ email, password });
      setMessage({ type: 'success', text: 'Račun je kreiran. Provjerite email za potvrdu računa.' });
      setView('login');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Registracija nije uspjela.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);
    try {
      await authApi.resetPasswordForEmail(email);
      setMessage({ type: 'success', text: 'Poslali smo email za reset lozinke.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Slanje emaila nije uspjelo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (next: AuthView) => {
    setView(next);
    resetFeedback();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
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
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {view !== 'forgot' && (
                <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      view === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Prijava
                  </button>
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      view === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Registracija
                  </button>
                </div>
              )}

              {!authApi.hasSupabaseConfig && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Auth je trenutno nedostupan jer Supabase varijable nisu postavljene.
                </div>
              )}

              {message && (
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    message.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {view === 'login' && (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Lozinka"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="submit" disabled={isLoading} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50">
                    {isLoading ? 'Prijava...' : 'Prijava'}
                  </button>
                  <button type="button" onClick={() => switchView('forgot')} className="text-sm text-primary font-medium hover:underline">
                    Zaboravili ste lozinku?
                  </button>
                </form>
              )}

              {view === 'register' && (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Lozinka"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Potvrdite lozinku"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="submit" disabled={isLoading} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50">
                    {isLoading ? 'Registracija...' : 'Registriraj se'}
                  </button>
                </form>
              )}

              {view === 'forgot' && (
                <form className="space-y-4" onSubmit={handleForgot}>
                  <p className="text-sm text-slate-600">Unesite email i poslat ćemo vam link za reset lozinke.</p>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button type="submit" disabled={isLoading} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50">
                    {isLoading ? 'Slanje...' : 'Pošalji link'}
                  </button>
                  <button type="button" onClick={() => switchView('login')} className="text-sm text-primary font-medium hover:underline">
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
