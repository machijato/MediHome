import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  // Za koji je korisnik provjera gotova; "loading" se izvodi iz toga da ne postoji trenutak
  // u kojem je korisnik poznat, a provjera još nije počela (inače bi /admin preusmjerio na početnu).
  const [checkedFor, setCheckedFor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setCheckedFor(undefined);
      return;
    }

    let active = true;

    const check = async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .maybeSingle();

      if (!active) return;
      setIsAdmin(data?.is_admin === true);
      setCheckedFor(userId);
    };

    check();

    return () => {
      active = false;
    };
  }, [userId]);

  const loading = Boolean(userId) && checkedFor !== userId;

  return { isAdmin: loading ? false : isAdmin, loading };
}
