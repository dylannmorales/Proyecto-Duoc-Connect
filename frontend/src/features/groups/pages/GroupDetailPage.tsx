import { IconExit, IconPencil, IconShare } from '@/shared/components/ui/Icons';
import { BackButton, BackNav } from '@/shared/components/ui/BackNav';
import { CopyLinkButton } from '@/shared/components/ui/CopyLinkButton';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreateGroupModal } from '@/features/groups/components/CreateGroupModal';
import { GroupChat } from '@/features/groups/components/GroupChat';
import { LeaveGroupModal } from '@/features/groups/components/LeaveGroupModal';
import { MemberList } from '@/features/groups/components/MemberList';
import { ShareGroupModal } from '@/features/groups/components/ShareGroupModal';
import { getGrupo, invitarYResumir, leaveGrupo, updateGrupo } from '@/features/groups/services/groupsService';
import type { CreateGrupoPayload, Grupo } from '@/features/groups/types/group.types';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const estadoNavegacion = location.state as { grupo?: Grupo; aviso?: string } | null;
  const initialGrupo = estadoNavegacion?.grupo;
  const [aviso, setAviso] = useState(estadoNavegacion?.aviso ?? '');
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

  async function handleEdit(payload: CreateGrupoPayload, invitados: string[]) {
    setError('');
    const actualizado = await updateGrupo(id!, payload);
    queryClient.setQueryData(['grupo', id], actualizado);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    const resumen = await invitarYResumir(actualizado.id, invitados);
    setAviso(resumen ? `Grupo actualizado. ${resumen}` : 'Grupo actualizado.');
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
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold">Grupo no encontrado</p>
        <p className="mt-1 text-sm text-gray-500">Puede que se haya eliminado o que el enlace no sea correcto.</p>
        <div className="mt-5">
          <BackButton to="/grupos" label="Ir a mis grupos" />
        </div>
      </div>
    );
  }

  if (!grupo.esMiembro) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold">Aún no eres parte de este grupo</p>
        <p className="mt-1 text-sm text-gray-500">Únete desde la lista de grupos para ver el chat y sus integrantes.</p>
        <div className="mt-5">
          <BackButton to="/grupos" label="Ir a grupos" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackNav to="/grupos" parentLabel="Grupos de estudio" current={grupo.nombre} />

      <header className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{grupo.nombre}</h1>
            {grupo.descripcion && <p className="mt-2 max-w-2xl text-gray-600">{grupo.descripcion}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{grupo.carreraNombre}</span>
              {grupo.asignaturaNombre && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{grupo.asignaturaNombre}</span>
              )}
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                {grupo.miembrosActuales}/{grupo.maxMiembros} integrantes
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                {grupo.privado ? 'Privado' : 'Público'}
              </span>
              {esAdmin && (
                <span className="rounded-full bg-duoc-yellow-soft px-2.5 py-1 font-medium text-gray-900">Eres administrador</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {esAdmin && (
              <Button variant="secondary" icon={<IconPencil className="h-4 w-4" />} onClick={() => setShowEdit(true)}>
                Editar
              </Button>
            )}
            <Button icon={<IconShare className="h-4 w-4" />} onClick={() => setShowShare(true)}>
              Compartir
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {grupo.codigoInvitacion ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              Código de invitación
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono font-bold tracking-wider text-gray-900">
                {grupo.codigoInvitacion}
              </span>
              <CopyLinkButton link={grupo.codigoInvitacion} label="Copiar código" compact />
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setShowLeave(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 sm:self-auto"
          >
            <IconExit className="h-4 w-4" />
            Salir del grupo
          </button>
        </div>
      </header>

      {aviso && <FormAlert type="success" message={aviso} />}
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
