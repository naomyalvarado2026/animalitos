import { useState } from 'react';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function EmergencyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: message = '' } = useQuery({
    queryKey: ['public-emergency-banner'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'emergency_banner').maybeSingle();
      if (error) throw error;
      return data?.value?.trim() ?? '';
    },
    staleTime: 60_000,
  });

  if (dismissed || !message) return null;

  return (
    <div className="bg-amber-600 text-white text-xs sm:text-sm py-2 px-4 relative z-50 flex items-center justify-between gap-2 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center flex-1">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-200 animate-pulse" />
        <span className="font-medium">
          🚨 <strong>Ayuda urgente:</strong> {message}
        </span>
        <Link
          to="/contacto/quiero-apoyar"
          className="underline font-semibold hover:text-amber-100 inline-flex items-center gap-0.5 ml-1"
        >
          Apoyar ahora <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-amber-700 transition-colors text-amber-100"
        aria-label="Cerrar banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
