import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError('Došlo je do greške. Pokušajte ponovno.');
      setLoading(false);
      return;
    }

    setSuccess('Lozinka uspješno promijenjena.');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Reset lozinke</h1>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {success && <p className="text-sm text-emerald-600 mb-4">{success}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nova lozinka"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
          <input
            type="password"
            placeholder="Ponovi novu lozinku"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Spremanje...' : 'Spremi novu lozinku'}
          </button>
        </form>

        <Link to="/" className="inline-block mt-4 text-sm text-primary hover:underline">
          Povratak na početnu
        </Link>
      </div>
    </div>
  );
};
