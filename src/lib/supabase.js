const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createQueryBuilder = (table) => {
  let selectedColumns = '*';

  const execute = async (orderColumn) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        data: null,
        error: new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
      };
    }

    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set('select', selectedColumns);

    if (orderColumn) {
      url.searchParams.set('order', `${orderColumn}.asc`);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      const payload = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: new Error(payload?.message ?? `Supabase request failed (${response.status})`),
        };
      }

      return { data: payload, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown Supabase error'),
      };
    }
  };

  return {
    select(columns = '*') {
      selectedColumns = columns;
      return {
        order: (column) => execute(column),
      };
    },
  };
};

export const supabase = {
  from: (table) => createQueryBuilder(table),
};
