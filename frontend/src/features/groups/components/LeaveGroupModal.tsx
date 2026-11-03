import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getGrupoMiembros } from '@/features/groups/services/groupsService';
import type { Grupo } from '@/features/groups/types/group.types';
import { Button } from '@/shared/components/ui/FormControls';

interface LeaveGroupModalProps {
  grupo: Grupo;
  open: boolean;
  leaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveGroupModal({ grupo, open, leaving, onClose, onConfirm }: LeaveGroupModalProps) {
  const { user } = useAuth();
  const miembrosQuery = useQuery({
    queryKey: ['grupo-miembros', grupo.id],
    queryFn: () => getGrupoMiembros(grupo.id),
    enabled: open,
  });

  if (!open) return null;

  const otros = (miembrosQuery.data ?? [])
    .filter((m) => m.usuarioId !== user?.id)
    .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  const esUltimo = miembrosQuery.isSuccess && otros.length === 0;
  const esAdmin = grupo.rolEnGrupo === 'ADMIN_GRUPO';
  const sucesor = esAdmin ? otros[0] : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="leave-group-title"
      aria-describedby="leave-group-desc"
      onClick={() => !leaving && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="leave-group-title" className="text-xl font-bold">
          ¿Salir de “{grupo.nombre}”?
        </h2>

        <div id="leave-group-desc" className="mt-3 space-y-3 text-sm text-gray-600">
          <p>Dejarás de ver el chat y los integrantes del grupo.</p>
          {grupo.privado && !esUltimo && (
            <p>Es un grupo privado: para volver necesitarás el código o una nueva invitación.</p>
          )}
          {sucesor && (
            <p className="rounded-lg bg-yellow-50 p-3 text-yellow-900">
              Eres el administrador. La administración pasará a <strong>{sucesor.nombre}</strong>, que lleva más
              tiempo en el grupo.
            </p>
          )}
          {esUltimo && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              Eres el último integrante: el grupo y todo su chat se <strong>eliminarán de forma permanente</strong>.
            </p>
          )}
          {miembrosQuery.isLoading && <p className="text-gray-400">Revisando integrantes...</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={leaving}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={leaving} disabled={miembrosQuery.isLoading}>
            {esUltimo ? 'Salir y eliminar grupo' : 'Salir del grupo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
