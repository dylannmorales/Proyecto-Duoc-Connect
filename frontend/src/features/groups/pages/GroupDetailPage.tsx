import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreateGroupModal } from '@/features/groups/components/CreateGroupModal';
import { GroupChat } from '@/features/groups/components/GroupChat';
import { LeaveGroupModal } from '@/features/groups/components/LeaveGroupModal';
import { MemberList } from '@/features/groups/components/MemberList';
import { ShareGroupModal } from '@/features/groups/components/ShareGroupModal';
import { getGrupo, leaveGrupo, updateGrupo } from '@/features/groups/services/groupsService';
import type { CreateGrupoPayload, Grupo } from '@/features/groups/types/group.types';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialGrupo = (location.state as { grupo?: Grupo } | null)?.grupo;
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const grupoQuery = useQuery({
    queryKey: ['grupo', id],
    queryFn: () => getGrupo(id!),
    enabled: !!id,
    initialData: initialGrupo?.id === id ? initialGrupo : undefined,
  });

  const grupo = grupoQuery.data;
  const esAdmin = grupo?.rolEnGrupo === 'ADMIN_GRUPO';

  async function handleEdit(payload: CreateGrupoPayload) {
    setError('');
    try {
      const actualizado = await updateGrupo(id!, payload);
      queryClient.setQueryData(['grupo', id], actualizado);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el grupo'));
      throw err;
    }
  }

  async function handleLeave() {
    if (!id) return;
    setLeaving(true);
    setError('');
    try {
      const { data: salida, message } = await leaveGrupo(id);
      queryClient.removeQueries({ queryKey: ['grupo', id] });
      queryClient.removeQueries({ queryKey: ['grupo-miembros', id] });
      queryClient.removeQueries({ queryKey: ['grupo-mensajes', id] });
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      const aviso = salida.nuevoAdministrador
        ? `${message}. ${salida.nuevoAdministrador} es ahora el administrador.`
        : `${message}.`;
      navigate('/grupos', { replace: true, state: { aviso } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo salir del grupo'));
      setShowLeave(false);
    } finally {
      setLeaving(false);
    }
  }

  if (grupoQuery.isLoading) {
    return <p className="text-gray-500">Cargando grupo...</p>;
  }

  if (!grupo) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Grupo no encontrado</p>
        <Link to="/grupos" className="mt-4 inline-block text-sm font-semibold hover:underline">
          Volver a grupos
        </Link>
      </div>
    );
  }

  if (!grupo.esMiembro) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Debes unirte al grupo para ver su contenido.</p>
        <Link to="/grupos" className="mt-4 inline-block text-sm font-semibold hover:underline">
          Volver a grupos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/grupos" className="mb-2 inline-block text-sm text-gray-500 hover:text-duoc-black">
            ← Volver a grupos
          </Link>
          <h1 className="text-2xl font-bold">{grupo.nombre}</h1>
          <p className="mt-1 text-gray-600">{grupo.carreraNombre}</p>
          {grupo.descripcion && <p className="mt-2 text-sm text-gray-500">{grupo.descripcion}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {grupo.codigoInvitacion && (
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
              Código: <span className="font-mono font-bold">{grupo.codigoInvitacion}</span>
            </div>
          )}
          <Button onClick={() => setShowShare(true)}>Compartir</Button>
          {esAdmin && (
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Editar grupo
            </Button>
          )}
          <Button variant="danger" onClick={() => setShowLeave(true)}>
            Salir del grupo
          </Button>
        </div>
      </div>

      {error && <FormAlert message={error} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GroupChat grupoId={grupo.id} />
        </div>
        <div>
          <MemberList grupoId={grupo.id} />
        </div>
      </div>

      <ShareGroupModal grupo={grupo} open={showShare} onClose={() => setShowShare(false)} />
      <LeaveGroupModal
        grupo={grupo}
        open={showLeave}
        leaving={leaving}
        onClose={() => setShowLeave(false)}
        onConfirm={handleLeave}
      />
      {esAdmin && (
        <CreateGroupModal grupo={grupo} open={showEdit} onClose={() => setShowEdit(false)} onSubmit={handleEdit} />
      )}
    </div>
  );
}
