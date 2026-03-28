const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SESSION_STORAGE_KEY = 'medihome.supabase.session';
const listeners = new Set();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

const getStoredSession = () => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const setStoredSession = (session) => {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const emitAuthChange = (event, session) => {
  listeners.forEach((callback) => callback(event, session));
};

const request = async (path, options = {}) => {
  const session = getStoredSession();

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { data: null, error: { message: payload?.msg || payload?.error_description || payload?.error || 'Request failed.' } };
  }

  return { data: payload, error: null };
};

export const supabase = {
  auth: {
    async getUser() {
      const session = getStoredSession();
      if (!session?.access_token) {
        return { data: { user: null }, error: null };
      }

      const { data, error } = await request('/auth/v1/user', { method: 'GET' });
      return { data: { user: data ?? null }, error };
    },

    async signInWithPassword({ email, password }) {
      const { data, error } = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (error) {
        return { data: { session: null, user: null }, error };
      }

      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        user: data.user,
      };

      setStoredSession(session);
      emitAuthChange('SIGNED_IN', session);

      return { data: { session, user: data.user }, error: null };
    },

    async signUp({ email, password }) {
      return request('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    async signOut() {
      const session = getStoredSession();
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      await request('/auth/v1/logout', { method: 'POST', headers });

      setStoredSession(null);
      emitAuthChange('SIGNED_OUT', null);

      return { error: null };
    },

    onAuthStateChange(callback) {
      listeners.add(callback);
      callback('INITIAL_SESSION', getStoredSession());

      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
  },
};
