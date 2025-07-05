import { useState, useEffect, useCallback } from 'react';

type SupabaseQuery<T> = () => Promise<{ data: T | null; error: any;[key: string]: any; }>;

export const useSupabase = <T,>(query: SupabaseQuery<T>, deps: readonly any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: resultData, error: anError } = await query();
      if (anError) {
        throw anError;
      }
      setData(resultData);
    } catch (e) {
      setError(e);
      // We don't re-throw here, the error state is sufficient for the UI
      console.error("Supabase query failed:", e);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
