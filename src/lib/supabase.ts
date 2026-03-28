type AuthEvent = 'SIGNED_IN' | 'PASSWORD_RECOVERY';

type Session = {
  access_token: string;
  refresh_token: string;
};

type AuthChangeCallback = (event: AuthEvent, session: Session | null) => void;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Nedostaju VITE_SUPABASE_URL ili VITE_SUPABASE_ANON_KEY varijable.');
}

const SESSION_STORAGE_KEY = 'medihome.supabase.recovery.session';
const listeners = new Set<AuthChangeCallback>();

const readSession = (): Session | null => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const writeSession = (session: Session | null) => {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const emitAuthEvent = (event: AuthEvent, session: Session | null) => {
  listeners.forEach((callback) => callback(event, session));
};

const setSession = async ({ access_token, refresh_token }: Session) => {
  const session = { access_token, refresh_token };
  writeSession(session);
  emitAuthEvent('PASSWORD_RECOVERY', session);

  return {
    data: { session },
    error: null,
  };
};

const getSession = async () => {
  const session = readSession();

  return {
    data: {
      session,
    },
    error: null,
  };
};

const updateUser = async ({ password }: { password: string }) => {
  const session = readSession();

  if (!session?.access_token) {
    return {
      data: { user: null },
      error: new Error('Nema aktivne sesije za promjenu lozinke.'),
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.msg ?? payload?.message ?? 'Neuspješna promjena lozinke.';

      return {
        data: { user: null },
        error: new Error(message),
      };
    }

    return {
      data: { user: payload },
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Neuspješna promjena lozinke.';

    return {
      data: { user: null },
      error: new Error(message),
    };
  }
};

const onAuthStateChange = (callback: AuthChangeCallback) => {
  listeners.add(callback);

  return {
    data: {
      subscription: {
        unsubscribe: () => listeners.delete(callback),
      },
    },
  };
};

export const supabase = {
  auth: {
    setSession,
    getSession,
    updateUser,
    onAuthStateChange,
  },
};
