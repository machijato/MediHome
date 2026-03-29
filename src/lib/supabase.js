const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageKey = 'medihome.supabase.access_token';

const getAccessTokenFromUrl = () => {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);

  return hashParams.get('access_token') || queryParams.get('access_token');
};

const persistAccessTokenIfPresent = () => {
  if (typeof window === 'undefined') return;
  const token = getAccessTokenFromUrl();
  if (token) {
    window.localStorage.setItem(storageKey, token);
  }
};

persistAccessTokenIfPresent();

const buildHeaders = (withAuth = false) => {
  const headers = {
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
  };

  if (withAuth && typeof window !== 'undefined') {
    const token = window.localStorage.getItem(storageKey);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const request = async (path, options = {}) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      data: null,
      error: { message: 'Supabase nije konfiguriran.' },
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1${path}`, options);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      return {
        data: null,
        error: payload || { message: 'Došlo je do greške.' },
      };
    }

    if (payload?.access_token && typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, payload.access_token);
    }

    return { data: payload, error: null };
  } catch (_error) {
    return {
      data: null,
      error: { message: 'Došlo je do greške. Pokušajte ponovno.' },
    };
  }
};

export const supabase = {
  auth: {
    signInWithPassword: ({ email, password }) =>
      request('/token?grant_type=password', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ email, password }),
      }),

    signUp: ({ email, password }) =>
      request('/signup', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ email, password }),
      }),

    resetPasswordForEmail: (email, { redirectTo } = {}) =>
      request('/recover', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ email, redirect_to: redirectTo }),
      }),

    updateUser: ({ password }) =>
      request('/user', {
        method: 'PUT',
        headers: buildHeaders(true),
        body: JSON.stringify({ password }),
      }),
  },
};
