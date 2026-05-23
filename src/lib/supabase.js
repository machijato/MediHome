import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseUrl = Boolean(supabaseUrl);
const hasSupabaseAnonKey = Boolean(supabaseAnonKey);
const urlLooksLikeSupabase = Boolean(supabaseUrl && supabaseUrl.includes('.supabase.co'));

console.info(
  `[supabase-config] VITE_SUPABASE_URL exists: ${hasSupabaseUrl ? 'yes' : 'no'}; contains .supabase.co: ${urlLooksLikeSupabase ? 'yes' : 'no'}; VITE_SUPABASE_ANON_KEY exists: ${hasSupabaseAnonKey ? 'yes' : 'no'}`,
);

if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are missing. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
