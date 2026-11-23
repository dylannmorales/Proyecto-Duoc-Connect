import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getGruposInvitables, invitarCompanero } from '@/features/invitations/services/invitationsService';
import { Spinner, Textarea } from '@/shared/components/ui/FormControls';
import { FormModal } from '@/shared/components/ui/FormKit';
import { IconUsers } from '@/shared/components/ui/Icons';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface InviteToGroupModalProps {
  open: boolean;
  usuarioId: string;
  nombre: string;
  onClose: () => void;
  onSent: (grupoNombre: string) => void;
}

/** Invitar a un compañero a uno de mis grupos desde su perfil, sin conocer su correo. */
export function InviteToGroupModal({ open, usuarioId, nombre, onClose, onSent }: InviteToGroupModalProps) {
  const queryClient = useQueryClient();
  const [grupoId, setGrupoId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const gruposQuery = useQuery({
    queryKey: ['grupos-invitables', usuarioId],
    queryFn: () => getGruposInvitables(usuarioId),
    enabled: open,
  });

  const grupos = gruposQuery.data ?? [];
  const disponibles = grupos.filter((g) => g.disponible);

  useEffect(() => {
    if (!open) return;
    setError('');
    setMensaje('');
    setGrupoId('');
  }, [open]);

  // Si solo hay un grupo disponible, lo dejamos elegido.
  useEffect(() => {
    if (open && !grupoId && disponibles.length === 1) setGrupoId(disponibles[0].grupoId);
  }, [open, grupoId, disponibles]);

  const mutation = useMutation({
    mutationFn: () => invitarCompanero(usuarioId, { grupoId, mensaje: mensaje.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-invitables', usuarioId] });
      onSent(grupos.find((g) => g.grupoId === grupoId)?.nombre ?? 'tu grupo');
    },
    onError: (err) => setError(getApiErrorMessage(err, 'No se pudo enviar la invitación')),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!grupoId) {
      setError('Elige el grupo al que quieres invitar');
      return;
    }
    setError('');
    mutation.mutate();
  }

  const primerNombre = nombre.split(' ')[0];

  return (
    <FormModal
      open={open}
      title={`Invitar a ${primerNombre} a un grupo`}
      subtitle="Le llegará una notificación y podrá aceptar o rechazar. No necesitas su correo."
      icon={<IconUsers className="h-5 w-5" />}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Enviar invitación"
      submitting={mutation.isPending}
      submitDisabled={!disponibles.length}
      error={error}
      footerNote={null}
    >
      <fieldset>
        <legend className="field-label">
          Tu grupo<span className="ml-0.5 text-red-500">*</span>
        </legend>

        {gruposQuery.isLoading && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner /> Cargando tus grupos...
          </p>
        )}

        {gruposQuery.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(gruposQuery.error, 'No se pudieron cargar tus grupos')}</p>
        )}

        {gruposQuery.isSuccess && grupos.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            Aún no perteneces a ningún grupo.{' '}
            <Link to="/grupos" className="font-semibold text-duoc-black hover:underline">
              Crea uno en Grupos
            </Link>{' '}
            y vuelve a este perfil para invitar a {primerNombre}.
          </div>
        )}

        {grupos.length > 0 && (
          <ul className="space-y-2">
            {grupos.map((g) => {
              const checked = grupoId === g.grupoId;
              return (
                <li key={g.grupoId}>
                  <label
                    className={`flex items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      !g.disponible
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                        : checked
                          ? 'cursor-pointer border-duoc-yellow bg-yellow-50'
                          : 'cursor-pointer border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="grupoId"
                      value={g.grupoId}
                      checked={checked}
                      disabled={!g.disponible}
                      onChange={() => setGrupoId(g.grupoId)}
                      className="accent-duoc-black"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block font-medium ${g.disponible ? 'text-gray-900' : ''}`}>{g.nombre}</span>
                      <span className="block text-xs">
                        {g.disponible ? `${g.miembros} de ${g.maxMiembros} integrantes` : g.motivo}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      {grupos.length > 0 && (
        <Textarea
          label="Mensaje (opcional)"
          name="mensaje"
          rows={3}
          maxLength={300}
          showCount
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder={`Hola ${primerNombre}, vi tu perfil y creo que podríamos trabajar bien juntos...`}
        />
      )}
    </FormModal>
  );
}
