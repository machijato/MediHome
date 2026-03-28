const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const buildError = (message, status) => ({
  message,
  status,
});

const postAuthRequest = async (path, payload) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      data: { user: null, session: null },
      error: buildError('Supabase nije konfiguriran. Postavite VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.', 500),
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        data: { user: null, session: null },
        error: buildError(result?.msg || result?.error_description || result?.message || 'Neuspješna autentikacija.', response.status),
      };
    }

    return {
      data: {
        user: result?.user ?? null,
        session: result?.session ?? null,
      },
      error: null,
    };
  } catch {
    return {
      data: { user: null, session: null },
      error: buildError('Neuspješna mrežna povezanost prema Supabase servisu.', 503),
    };
  }
};

export const supabase = {
  auth: {
    signUp: ({ email, password, options = {} }) => postAuthRequest('signup', {
      email,
      password,
      data: options.data || {},
    }),
  },
};
