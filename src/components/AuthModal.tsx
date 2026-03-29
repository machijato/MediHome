import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
              <h2 className="text-2xl font-bold text-slate-900">Korisnički račun</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="Zatvori">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Prijava
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Registracija
                </button>
              </div>

              {activeTab === 'login' ? (
                <form className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-2">Lozinka</label>
                    <input
                      id="login-password"
                      type="password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button type="button" className="text-sm text-primary font-semibold hover:underline">
                    Zaboravljena lozinka?
                  </button>
                  <button type="submit" className="w-full px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                    Prijava
                  </button>
                </form>
              ) : (
                <form className="space-y-4">
                  <div>
                    <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-2">Ime i prezime</label>
                    <input
                      id="register-name"
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      id="register-email"
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-2">Lozinka</label>
                    <input
                      id="register-password"
                      type="password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button type="submit" className="w-full px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                    Registracija
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
