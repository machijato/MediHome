import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetMessages();
    onClose();
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
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
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage('Neispravni podaci za prijavu.');
          return;
        }

        setEmail('');
        setPassword('');
        setFullName('');
        handleClose();
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

      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Prijava</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        <form className="space-y-4" onSubmit={handleSubmit}>
          {activeTab === 'register' && (
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

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="unesite@email.hr"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
          {successMessage && <p className="text-sm font-medium text-green-600">{successMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Učitavanje...' : activeTab === 'login' ? 'Prijava' : 'Registracija'}
          </button>
        </form>
      </div>
    </div>
  );
};
