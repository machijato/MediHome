import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const check = async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .maybeSingle();

      setIsAdmin(data?.is_admin === true);
      setLoading(false);
    };

    check();
  }, [userId]);

  return { isAdmin, loading };
}
