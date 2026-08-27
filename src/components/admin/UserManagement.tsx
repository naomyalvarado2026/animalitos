import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Shield, Edit2, Check, X, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Profile, UserRole } from '@/types';
import { formatDateShort } from '@/lib/utils';

const ROLES: { value: UserRole; label: string; level: number }[] = [
  { value: 'super_admin', label: 'Super Admin', level: 10 },
  { value: 'admin', label: 'Admin', level: 7 },
  { value: 'editor', label: 'Editor', level: 4 },
  { value: 'viewer', label: 'Viewer', level: 1 },
];

const ROLE_VARIANT: Record<UserRole, 'warm' | 'default' | 'secondary' | 'outline'> = {
  super_admin: 'warm',
  admin: 'default',
  editor: 'secondary',
  viewer: 'outline',
};

export function UserManagement() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('viewer');
  const [editLevel, setEditLevel] = useState<number>(1);
  const [search, setSearch] = useState('');

  // Only super_admin can access this page
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, role, access_level, is_active }: Partial<Profile> & { id: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role, access_level, is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario actualizado correctamente.');
      setEditingId(null);
    },
    onError: () => toast.error('Error al actualizar el usuario.'),
  });

  function startEdit(user: Profile) {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditLevel(user.access_level);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(user: Profile) {
    updateUser.mutate({ id: user.id, role: editRole, access_level: editLevel, is_active: user.is_active });
  }

  function toggleActive(user: Profile) {
    updateUser.mutate({ id: user.id, is_active: !user.is_active });
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--color-primary)]" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Solo visible para Super Administradores.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar por email o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Buscar usuarios"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-[var(--color-muted-foreground)]">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-[var(--color-muted-foreground)]">
              No se encontraron usuarios.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filtered.map((user) => (
                <div key={user.id} className="py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl brand-gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(user.full_name ?? user.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{user.full_name ?? '—'}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] truncate">{user.email}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Desde {formatDateShort(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {editingId === user.id ? (
                        <>
                          {/* Role selector */}
                          <div className="relative">
                            <select
                              value={editRole}
                              onChange={e => {
                                const r = e.target.value as UserRole;
                                setEditRole(r);
                                setEditLevel(ROLES.find(ro => ro.value === r)?.level ?? 1);
                              }}
                              className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 bg-[var(--color-background)] pr-6"
                              aria-label="Seleccionar rol"
                            >
                              {ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-[var(--color-muted-foreground)]" />
                          </div>
                          {/* Level input */}
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={editLevel}
                            onChange={e => setEditLevel(Number(e.target.value))}
                            className="w-14 text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 bg-[var(--color-background)] text-center"
                            aria-label="Nivel de acceso"
                          />
                          <Button size="sm" variant="default" onClick={() => saveEdit(user)} disabled={updateUser.isPending}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant={ROLE_VARIANT[user.role]}>{user.role}</Badge>
                          <Badge variant="outline">Nivel {user.access_level}</Badge>
                          <Badge variant={user.is_active ? 'success' : 'secondary'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(user)} aria-label="Editar usuario">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleActive(user)}
                            aria-label={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                            className={user.is_active ? 'text-[var(--color-destructive)]' : 'text-emerald-500'}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
