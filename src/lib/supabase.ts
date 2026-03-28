const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

interface AuthResult {
  data: unknown;
  error: Error | null;
}

const missingConfigError = () =>
  new Error('Supabase konfiguracija nije postavljena. Dodajte VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY u .env datoteku.');

const postToSupabaseAuth = async (path: string, payload: Record<string, unknown>): Promise<AuthResult> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: missingConfigError() };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        typeof responseData?.msg === 'string'
          ? responseData.msg
          : typeof responseData?.message === 'string'
            ? responseData.message
            : 'Dogodila se greška pri komunikaciji sa Supabase servisom.';

      return { data: null, error: new Error(message) };
    }

    return { data: responseData, error: null };
  } catch {
    return { data: null, error: new Error('Mrežna greška. Pokušajte ponovno.') };
  }
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      return postToSupabaseAuth('token?grant_type=password', { email, password });
    },

    signUp: async ({ email, password }: { email: string; password: string }) => {
      return postToSupabaseAuth('signup', { email, password });
    },

    resetPasswordForEmail: async (email: string, { redirectTo }: { redirectTo: string }) => {
      return postToSupabaseAuth('recover', { email, redirect_to: redirectTo });
    }
  }
};
