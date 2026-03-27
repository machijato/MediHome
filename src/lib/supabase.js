const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const authRequest = async (path, body) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { data: null, error: { message: 'Supabase konfiguracija nije postavljena.' } };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: data?.msg || data?.error_description || 'Autentikacija nije uspjela.' } };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: { message: 'Greška mreže. Pokušajte ponovno.' } };
  }
};

export const supabase = {
  auth: {
    signUp: async ({ email, password }) => authRequest('signup', { email, password }),
    signInWithPassword: async ({ email, password }) => authRequest('token?grant_type=password', { email, password })
  }
};
