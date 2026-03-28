import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, LogIn, UserPlus, X } from 'lucide-react';
import { supabase } from './lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'signup';

const initialForm = {
  email: '',
  password: '',
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialForm);
      setError('');
      setMessage('');
      setMode('login');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  const handleChange = (key: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) throw loginError;
        if (!data.user) throw new Error('Prijava nije uspjela. Pokušajte ponovno.');

        onAuthSuccess(data.user);
        setMessage('Uspješna prijava.');
        setFormData(initialForm);
        onClose();
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signupError) throw signupError;

      setMessage('Registracija uspješna. Provjerite email za potvrdu računa.');
      setFormData(initialForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Dogodila se greška. Pokušajte ponovno.');
    } finally {
      setIsSubmitting(false);
    }
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
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Prijava' : 'Registracija'}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === 'login' ? 'Prijavite se u MediHome račun.' : 'Otvorite novi MediHome račun.'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ime@primjer.hr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Lozinka</label>
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Minimalno 6 znakova"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isSubmitting ? 'Molimo pričekajte...' : mode === 'login' ? 'Prijavi se' : 'Registriraj se'}
              </button>

              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="w-full text-sm text-slate-600 hover:text-primary transition-colors"
              >
                {mode === 'login' ? 'Nemate račun? Registrirajte se' : 'Već imate račun? Prijavite se'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
