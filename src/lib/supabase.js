const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Nedostaju VITE_SUPABASE_URL ili VITE_SUPABASE_ANON_KEY varijable.');
}

const SESSION_KEY = 'medihome.supabase.session';

const getStoredSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const setStoredSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const captureRecoverySessionFromUrl = () => {
  if (typeof window === 'undefined') return;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const type = params.get('type');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresIn = Number(params.get('expires_in') || '3600');

  if (type === 'recovery' && accessToken && refreshToken) {
    setStoredSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Date.now() + expiresIn * 1000,
    });

    const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
};

captureRecoverySessionFromUrl();

const mapError = async (response) => {
  let message = 'Došlo je do greške.';

  try {
    const body = await response.json();
    message = body.error_description || body.msg || body.error || message;
  } catch {
    // no-op
  }

  return { message };
};

const request = async (path, options = {}) => {
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    return { data: null, error: await mapError(response) };
  }

  const text = await response.text();
  return { data: text ? JSON.parse(text) : null, error: null };
};

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      const { data, error } = await request('/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data?.access_token) {
        setStoredSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        });
      }

      return { data, error };
    },

    async resetPasswordForEmail(email, { redirectTo }) {
      return request('/recover', {
        method: 'POST',
        body: JSON.stringify({ email, redirect_to: redirectTo }),
      });
    },

    async updateUser({ password }) {
      const session = getStoredSession();

      if (!session?.access_token) {
        return { data: null, error: { message: 'Sesija za reset lozinke nije pronađena.' } };
      }

      return request('/user', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ password }),
      });
    },
  },
};
