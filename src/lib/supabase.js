const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const createQuery = (table, query = {}) => ({
  select(columns) {
    return createQuery(table, { ...query, select: columns });
  },
  order(column, options = { ascending: true }) {
    const direction = options.ascending ? 'asc' : 'desc';
    const params = new URLSearchParams();
    params.set('select', query.select ?? '*');
    params.set('order', `${column}.${direction}`);

    return fetch(`${supabaseUrl}/rest/v1/${table}?${params.toString()}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorMessage = await response.text();
          return { data: null, error: { message: errorMessage || 'Request failed' } };
        }
        const data = await response.json();
        return { data, error: null };
      })
      .catch((error) => ({ data: null, error }));
  }
});

export const supabase = {
  from(table) {
    return createQuery(table);
  }
};
