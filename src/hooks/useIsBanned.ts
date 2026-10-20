import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Je li prijavljeni korisnik blokiran (provider_profiles.status = 'banned').
// Stvarnu zabranu provodi baza; ovo služi samo za prikaz jasne poruke umjesto obrasca.
export function useIsBanned(userId: string | undefined): boolean {
  const [bannedFor, setBannedFor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      setBannedFor(undefined);
      return;
    }
    let active = true;
    supabase
      .from('provider_profiles')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setBannedFor(data?.status === 'banned' ? userId : undefined);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return Boolean(userId) && bannedFor === userId;
}
