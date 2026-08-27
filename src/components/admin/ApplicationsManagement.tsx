import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FileText, CheckCircle2, XCircle, Clock, Mail, Phone, MapPin, MessageSquare, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { AdoptionApplication, VolunteerApplication } from '@/types';
import { formatDateShort } from '@/lib/utils';

export function ApplicationsManagement() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'adoptions' | 'volunteers'>('adoptions');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { data: adoptions = [] } = useQuery({
    queryKey: ['admin-adoptions'],
    queryFn: async () => {
      const { data } = await supabase.from('adoption_applications').select('*, animal:animals(name)').order('created_at', { ascending: false });
      return (data ?? []) as AdoptionApplication[];
    },
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['admin-volunteers'],
    queryFn: async () => {
      const { data } = await supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false });
      return (data ?? []) as VolunteerApplication[];
    },
  });

  const updateAdoption = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('adoption_applications').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-adoptions'] });
      toast.success('Estado de solicitud actualizado.');
    },
  });

  const filteredAdoptions = adoptions.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-[var(--color-primary)]" />
            Solicitudes Recibidas
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Revisa y gestiona las solicitudes de adopción y voluntariado.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-2">
        <div className="flex border-b sm:border-b-0 border-[var(--color-border)]">
          <button
            onClick={() => setTab('adoptions')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'adoptions'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-bold'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            }`}
          >
            🐶 Adopciones ({adoptions.length})
          </button>
          <button
            onClick={() => setTab('volunteers')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'volunteers'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-bold'
                : 'border-transparent text-[var(--color-muted-foreground)]'
            }`}
          >
            🤝 Voluntariado ({volunteers.length})
          </button>
        </div>

        {tab === 'adoptions' && (
          <div className="flex items-center gap-1.5 text-xs bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)]">
            <span className="text-[var(--color-muted-foreground)] px-2 font-medium">Estado:</span>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'pending', label: 'Pendientes ⏳' },
              { id: 'approved', label: 'Aprobadas ✅' },
              { id: 'rejected', label: 'Rechazadas ❌' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === f.id
                    ? 'bg-[var(--color-card)] text-[var(--color-foreground)] font-bold shadow-xs'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          {tab === 'adoptions' ? (
            filteredAdoptions.length === 0 ? (
              <p className="text-center py-10 text-[var(--color-muted-foreground)]">No hay solicitudes que coincidan con este filtro.</p>
            ) : (
              <div className="space-y-4 divide-y divide-[var(--color-border)]">
                {filteredAdoptions.map(app => {
                  const cleanPhone = app.applicant_phone.replace(/\D/g, '');
                  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${app.applicant_name}, nos comunicamos de Fundación Animalitos sobre tu solicitud de adopción.`)}`;

                  return (
                    <div key={app.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-heading font-bold text-lg">{app.applicant_name}</h3>
                          <p className="text-xs text-[var(--color-primary)] font-semibold">
                            Interesado en: {app.animal?.name ?? 'Animalitos Rescatados'}
                          </p>
                        </div>
                        <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'secondary' : 'warning'}>
                          {app.status === 'approved' ? 'Aprobada' : app.status === 'rejected' ? 'Rechazada' : 'Pendiente de revisión'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-background)] p-3 rounded-xl">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {app.applicant_email}</span>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {app.applicant_phone} (WhatsApp 💬)
                        </a>
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {app.applicant_address}</span>
                      </div>

                      <p className="text-xs text-[var(--color-foreground)] leading-relaxed italic border-l-2 border-[var(--color-primary)] pl-3">
                        "{app.reason}"
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          Recibida: {formatDateShort(app.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50" onClick={() => updateAdoption.mutate({ id: app.id, status: 'approved' })}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => updateAdoption.mutate({ id: app.id, status: 'rejected' })}>
                            <XCircle className="h-4 w-4 mr-1" /> Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            volunteers.length === 0 ? (
              <p className="text-center py-10 text-[var(--color-muted-foreground)]">No hay solicitudes de voluntariado registradas.</p>
            ) : (
              <div className="space-y-4 divide-y divide-[var(--color-border)]">
                {volunteers.map(vol => (
                  <div key={vol.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-heading font-bold text-base">{vol.full_name}</h3>
                      <Badge variant="secondary" className="text-xs">{vol.area_of_interest}</Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-[var(--color-muted-foreground)]">
                      <span>✉️ {vol.email}</span>
                      <span>📞 {vol.phone}</span>
                      <span>🗓️ {vol.availability}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

