import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminStats,
  listAdminUsuarios,
  updateUsuarioEstado,
  updateUsuarioRol,
} from '@/features/admin/services/adminService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { RolUsuario } from '@/shared/types/api.types';

type AdminTab = 'resumen' | 'usuarios';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>('resumen');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  const usuariosQuery = useQuery({
    queryKey: ['admin', 'usuarios', page],
    queryFn: () => listAdminUsuarios(page),
    enabled: tab === 'usuarios',
  });

  const rolMutation = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: RolUsuario }) => updateUsuarioRol(id, rol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      updateUsuarioEstado(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function changeTab(next: AdminTab) {
    setTab(next);
    setPage(0);
    setError('');
  }

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'usuarios', label: 'Usuarios y roles' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="mt-1 text-sm text-gray-600">Gestiona los usuarios y sus roles.</p>
      </div>

      {error && <FormAlert message={error} />}

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeTab(item.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'bg-duoc-yellow text-duoc-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsQuery.isLoading && <p className="text-gray-500">Cargando estadísticas...</p>}
          {statsQuery.data && (
            <>
              <StatCard label="Usuarios" value={statsQuery.data.totalUsuarios} />
              <StatCard label="Usuarios activos" value={statsQuery.data.usuariosActivos} />
              <StatCard label="Grupos" value={statsQuery.data.totalGrupos} />
              <StatCard label="Apuntes" value={statsQuery.data.totalApuntes} />
              <StatCard label="Mensajes chat" value={statsQuery.data.totalMensajes} />
            </>
          )}
        </div>
      )}

      {tab === 'usuarios' && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Carrera / Sede</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Registro</th>
                </tr>
              </thead>
              <tbody>
                {usuariosQuery.data?.content.map((usuario) => {
                  const isSelf = usuario.id === user?.id;
                  return (
                    <tr key={usuario.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{usuario.nombre}</p>
                        <p className="text-xs text-gray-500">{usuario.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {usuario.carreraNombre}
                        <br />
                        <span className="text-xs">{usuario.sedeNombre}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={usuario.rol}
                          disabled={isSelf || rolMutation.isPending}
                          onChange={(e) => {
                            setError('');
                            rolMutation.mutate({
                              id: usuario.id,
                              rol: e.target.value as RolUsuario,
                            });
                          }}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                        >
                          <option value="ESTUDIANTE">Estudiante</option>
                          <option value="ADMINISTRADOR">Administrador</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isSelf || estadoMutation.isPending}
                          onClick={() => {
                            setError('');
                            estadoMutation.mutate({ id: usuario.id, activo: !usuario.activo });
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            usuario.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          } disabled:opacity-50`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(usuario.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {usuariosQuery.isLoading && <p className="text-gray-500">Cargando usuarios...</p>}

          {usuariosQuery.data && usuariosQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page + 1} de {usuariosQuery.data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={usuariosQuery.data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
