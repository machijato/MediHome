const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const accessTokenStorageKey = 'medihome_supabase_access_token';

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('Nedostaju Supabase varijable okruženja: VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY');
}

const getStoredAccessToken = () => localStorage.getItem(accessTokenStorageKey);

const storeAccessToken = (token) => {
  if (token) {
    localStorage.setItem(accessTokenStorageKey, token);
  }
};

const clearAccessToken = () => {
  localStorage.removeItem(accessTokenStorageKey);
};

const parseRecoveryTokenFromUrl = () => {
  if (typeof window === 'undefined' || !window.location.hash) return;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const type = hashParams.get('type');

  if (type === 'recovery' && accessToken) {
    storeAccessToken(accessToken);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }
};

parseRecoveryTokenFromUrl();

const authRequest = async (path, options = {}, useAuthToken = false) => {
  const token = getStoredAccessToken();

  const headers = {
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(useAuthToken && token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: null,
      error: {
        message: data?.msg || data?.error_description || data?.message || 'Došlo je do greške. Pokušajte ponovno.'
      }
    };
  }

  return { data, error: null };
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      const result = await authRequest('/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!result.error) {
        storeAccessToken(result.data?.access_token);
      }

      return result;
    },

    signUp: async ({ email, password }) => {
      return authRequest('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },

    resetPasswordForEmail: async (email, { redirectTo } = {}) => {
      const redirectParam = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';

      return authRequest(`/recover${redirectParam}`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    updateUser: async ({ password }) => {
      const result = await authRequest('/user', {
        method: 'PUT',
        body: JSON.stringify({ password })
      }, true);

      if (result.error?.message?.toLowerCase().includes('jwt')) {
        clearAccessToken();
      }

      return result;
    }
  }
};
