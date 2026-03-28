const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const request = async (path, body) => {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase nije konfiguriran. Dodajte VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY u .env.local.');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error_description || data?.msg || data?.message || 'Greška pri autentifikaciji.');
  }

  return data;
};

export const authApi = {
  hasSupabaseConfig,
  signInWithPassword: ({ email, password }) => request('token?grant_type=password', { email, password }),
  signUp: ({ email, password }) => request('signup', { email, password }),
  resetPasswordForEmail: (email) => request('recover', { email }),
};
