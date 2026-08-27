import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePublicSettings(keys: string[]) {
  return useQuery({
    queryKey: ['public-settings', ...keys],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('key, value').in('key', keys);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((item) => [item.key, item.value]));
    },
    staleTime: 60_000,
  });
}
