import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
export interface Campaign { id: string; slug: string; title: string; season: string; description: string; starts_on: string; ends_on: string; image_url: string; actions: string[]; is_active: boolean }
export function useCampaigns(admin = false) {
  return useQuery({ queryKey: ['seasonal-campaigns', admin], staleTime: 60_000, queryFn: async () => {
    let query = supabase.from('seasonal_campaigns').select('*').order('starts_on');
    if (!admin) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Campaign[];
  } });
}
export function campaignPeriod(campaign: Campaign) {
  const format = (date: string) => new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  return `${format(campaign.starts_on)} — ${format(campaign.ends_on)}`;
}
