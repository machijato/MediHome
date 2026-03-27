import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (payload: { email: string; password: string }) => Promise<void> | void;
  onSignup: (payload: { email: string; password: string }) => Promise<void> | void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormValid || isLoginLoading) return;
    setIsLoginLoading(true);
    try {
      await onLogin({ email: email.trim(), password });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!isFormValid || isSignupLoading) return;
    setIsSignupLoading(true);
    try {
      await onSignup({ email: email.trim(), password });
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">Prijava</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Zatvori prijavu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <label htmlFor="auth-email" className="block text-sm font-bold text-slate-700">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  placeholder="unesite@email.hr"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="auth-password" className="block text-sm font-bold text-slate-700">
                  Lozinka
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row">
              <button
                type="button"
                onClick={handleLogin}
                disabled={!isFormValid || isLoginLoading}
                className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoginLoading ? 'Prijava...' : 'Prijavi se'}
              </button>
              <button
                type="button"
                onClick={handleSignup}
                disabled={!isFormValid || isSignupLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSignupLoading ? 'Registracija...' : 'Registriraj se'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
